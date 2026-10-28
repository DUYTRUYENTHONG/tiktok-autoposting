"""Pinned VieNeu LoRA encoding/training/evaluation. Local files only; never activates a voice."""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import importlib.util
import json
import math
import os
from pathlib import Path
import socket
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((Path(__file__).parent/'config.json').read_text(encoding='utf-8'))
spec = importlib.util.spec_from_file_location('voice_corpus', ROOT/'scripts/prepare-voice-training.py')
corpus = importlib.util.module_from_spec(spec)
spec.loader.exec_module(corpus)


def read_jsonl(path):
    return [json.loads(line) for line in path.read_text(encoding='utf-8').splitlines() if line.strip()]


def verify_encoded_splits(dataset, encoding, ready):
    """Bind cached codec rows to the current consent, policy and assigned holdouts."""
    for key, expected in (('datasetSha256', ready['datasetSha256']), ('configSha256', ready['configSha256']),
                          ('baseRevision', CONFIG['baseRevision']), ('codecRevision', CONFIG['codecRevision']),
                          ('upstreamRevision', CONFIG['upstreamRevision']), ('rawSplitHashes', ready['rawSplitHashes'])):
        if encoding.get(key) != expected:
            raise ValueError('Encoded corpus/model/policy provenance mismatch: '+key)
    if set(encoding.get('files', {})) != {'train', 'validation', 'test'}:
        raise ValueError('Exactly train, validation and test encoded hashes are required')
    seen = set()
    for name, digest in encoding['files'].items():
        if corpus.sha(dataset/(name+'.jsonl')) != ready['rawSplitHashes'][name]:
            raise ValueError('Prepared original split changed: '+name)
        target = dataset/(name+'.encoded.jsonl')
        if corpus.sha(target) != digest:
            raise ValueError('Encoded split changed: '+name)
        expected = {r['id']+'.wav': r['text'] for r in read_jsonl(dataset/(name+'.jsonl'))}
        rows = read_jsonl(target)
        names = [r['file_name'] for r in rows]
        if len(set(names)) != len(names) or set(names) != set(expected) or seen.intersection(names):
            raise ValueError('Encoded row membership/holdout leakage mismatch: '+name)
        if any(r['text'] != expected[r['file_name']] for r in rows):
            raise ValueError('Encoded transcript changed: '+name)
        seen.update(names)


def verify_adapter(adapter, ready, encoding):
    provenance = json.loads((adapter/'sakura-provenance.json').read_text(encoding='utf-8'))
    expected = dict(datasetSha256=ready['datasetSha256'], baseRevision=CONFIG['baseRevision'],
        upstreamRevision=CONFIG['upstreamRevision'], codecRevision=CONFIG['codecRevision'],
        configSha256=ready['configSha256'], encodedSplitHashes=encoding['files'],
        rawSplitHashes=ready['rawSplitHashes'], config=CONFIG)
    if any(provenance.get(key) != value for key, value in expected.items()):
        raise ValueError('Adapter base/corpus/config/split provenance mismatch')
    files = provenance.get('adapterFiles', {})
    if set(files) != {'adapter_config.json', 'adapter_model.safetensors'}:
        raise ValueError('Adapter config/weight hashes required')
    for name, digest in files.items():
        if corpus.sha(adapter/name) != digest:
            raise ValueError('Adapter artifact checksum mismatch: '+name)
    if (adapter/'extra_trainable.json').exists() or (adapter/'extra_trainable.safetensors').exists():
        raise ValueError('This backbone-only recipe does not accept extra unfrozen weights')
    return provenance


def summarize_evaluation(records):
    """Corpus-token-weighted CE/perplexity, not mean-of-utterance perplexities."""
    totals = {name: sum(r[name] for r in records) for name in ('textTargets', 'audioTargets', 'cb0Targets', 'examples')}
    if any(value <= 0 for value in totals.values()):
        raise ValueError('Evaluation requires nonempty text/audio targets')
    text = sum(r['text_loss']*r['textTargets'] for r in records)/totals['textTargets']
    audio = sum(r['audio_loss']*r['audioTargets'] for r in records)/totals['audioTargets']
    accuracy = sum(r['acc_cb0']*r['cb0Targets'] for r in records)/totals['cb0Targets']
    t = CONFIG['training']
    return dict(text_loss=text, audio_loss=audio, acc_cb0=accuracy,
        loss=(text*t['textLossWeight']+audio*t['audioLossWeight'])/(t['textLossWeight']+t['audioLossWeight']),
        textPerplexity=math.exp(min(text, 700)), audioCodePerplexity=math.exp(min(audio, 700)),
        lossAggregation='corpus-token-weighted text and audio-code cross entropy', **totals)


def verify_source(path):
    path = corpus.private_path(path)
    revision = subprocess.check_output(['git', '-C', str(path), 'rev-parse', 'HEAD'], text=True).strip()
    changed = subprocess.check_output(['git', '-C', str(path), 'status', '--porcelain'], text=True).strip()
    if revision != CONFIG['upstreamRevision'] or changed:
        raise ValueError('Need a clean external upstream checkout at '+CONFIG['upstreamRevision'])
    return path


def verify_base(path):
    """Check LFS SHA256 and Git blob SHA1 published by the pinned Hugging Face revision."""
    path = corpus.private_path(path)
    lock = json.loads((Path(__file__).parent/'base-artifacts.json').read_text(encoding='utf-8-sig'))
    for item in lock['files']:
        target = path/item['file']
        if item['algorithm'] == 'sha256':
            digest = corpus.sha(target)
        else:
            data = target.read_bytes()
            digest = hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
        if digest != item['digest']:
            raise ValueError('Pinned model artifact mismatch: '+item['file'])
    return path


def offline():
    os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1',
                      HF_HUB_DISABLE_IMPLICIT_TOKEN='1', WANDB_DISABLED='true', DO_NOT_TRACK='1')
    def deny(*_args, **_kwargs):
        raise RuntimeError('Voice training/evaluation is local-only; network disabled')
    socket.socket.connect = deny
    socket.socket.connect_ex = deny
    socket.create_connection = deny
    socket.getaddrinfo = deny


def check_dependencies(encoding=False):
    for name, expected in CONFIG['dependencies'].items():
        if encoding and name not in ('pyarrow', 'sea-g2p'):
            continue
        installed = importlib.metadata.version(name).split('+')[0]
        if installed != expected:
            raise ValueError(f'{name}=={expected} required; found {installed}')


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('action', choices=['encode', 'train', 'evaluate'])
    ap.add_argument('--manifest', type=Path, required=True)
    ap.add_argument('--prepared', type=Path, required=True)
    ap.add_argument('--upstream', type=Path, required=True)
    ap.add_argument('--base', type=Path, required=True, help='Complete pinned local HF snapshot, including update/ weights')
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--adapter', type=Path, help='Previously trained best adapter for evaluate')
    ap.add_argument('--runtime-config', type=Path, required=True, help='Existing private pinned VieNeu runtime.json; verifies cached CPU codec assets')
    ap.add_argument('--render-comparison', action='store_true', help='For evaluate: merge privately and render at most five paired held-out sentences for listening/latency')
    args = ap.parse_args()
    # Revalidate consent and original audio now, not just a saved ready flag.
    ready = corpus.validate(args.manifest, args.prepared)
    if not ready['dataReady']:
        raise ValueError('Corpus not ready: '+'; '.join(ready['errors']))
    if args.action != 'encode' and not ready['hardware']['available']:
        raise ValueError(ready['hardware']['note'])
    upstream, base = verify_source(args.upstream), verify_base(args.base)
    output = corpus.private_path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    (output/'launch-readiness.json').write_text(json.dumps(dict(trainingReady=False,
        evaluationReady=False, deploymentReady=False, note='Preflight in progress; successful execution is unproven'), indent=2), encoding='utf-8')
    runtime = json.loads(corpus.private_path(args.runtime_config).read_text(encoding='utf-8-sig'))
    asset_path = corpus.private_path(runtime['modelManifest'])
    if corpus.sha(asset_path) != runtime['modelSha256']:
        raise ValueError('Runtime asset manifest checksum mismatch')
    assets = json.loads(asset_path.read_text(encoding='utf-8-sig'))
    if (assets['sdkVersion'] != CONFIG['sdkVersion'] or assets['modelRevision'] != CONFIG['baseRevision']
            or assets['codecRevision'] != CONFIG['codecRevision']):
        raise ValueError('Runtime/model/codec revisions do not match training pins')
    for item in assets['files']:
        if corpus.sha(corpus.private_path(item['path'])) != item['sha256']:
            raise ValueError('Cached asset checksum mismatch: '+item['file'])
        if item.get('repo') == CONFIG['baseModel'] and corpus.sha(base/item['file']) != item['sha256']:
            raise ValueError('Local base snapshot must contain the same pinned CPU graphs: '+item['file'])
    cache = corpus.private_path(runtime['hfCache'])
    for repo, revision in ((CONFIG['baseModel'], CONFIG['baseRevision']), (CONFIG['codecModel'], CONFIG['codecRevision'])):
        if (cache/('models--'+repo.replace('/', '--'))/'refs/main').read_text(encoding='utf-8').strip() != revision:
            raise ValueError('Offline cache ref does not match the pinned revision: '+repo)
    os.environ['HF_HUB_CACHE'] = str(cache)
    check_dependencies(args.action == 'encode')
    offline()
    sys.path[:0] = [str(upstream/'src'), str(upstream/'finetune')]
    dataset = Path(ready['datasetDirectory'])
    if args.action == 'encode':
        # Same codec/phonemizer/speaker encoder as pinned SDK. No alternate text format.
        import runpy
        sys.argv = [str(upstream/'finetune/prepare_dataset.py'), '--dataset-dir', str(dataset), '--base', str(base)]
        runpy.run_path(sys.argv[0], run_name='__main__')
        from vieneu_lora import load_rows
        encoded = load_rows(dataset/'train.parquet')
        by_name = {r['file_name']: r for r in encoded}
        originals = sum((read_jsonl(dataset/(name+'.jsonl')) for name in ('train', 'validation', 'test')), [])
        if len(by_name) != len(originals):
            raise ValueError('Encoder skipped/duplicated corpus rows; inspect output, do not train')
        for name in ('train', 'validation', 'test'):
            rows = [by_name[r['id']+'.wav'] for r in read_jsonl(dataset/(name+'.jsonl'))]
            (dataset/(name+'.encoded.jsonl')).write_text(''.join(json.dumps(r, ensure_ascii=False)+'\n' for r in rows), encoding='utf-8')
        (dataset/'encoding.json').write_text(json.dumps(dict(datasetSha256=ready['datasetSha256'],
            configSha256=ready['configSha256'], rawSplitHashes=ready['rawSplitHashes'],
            baseRevision=CONFIG['baseRevision'], codecRevision=CONFIG['codecRevision'], upstreamRevision=CONFIG['upstreamRevision'],
            files={name: corpus.sha(dataset/(name+'.encoded.jsonl')) for name in ('train', 'validation', 'test')}), indent=2), encoding='utf-8')
        print(json.dumps(dict(encoded=True, dataset=str(dataset))))
        return
    encoding = json.loads((dataset/'encoding.json').read_text(encoding='utf-8'))
    verify_encoded_splits(dataset, encoding, ready)
    import torch
    from torch.utils.data import DataLoader
    from transformers import AutoTokenizer, get_scheduler
    from vieneu._v3_turbo_engine.hub_load_v3_turbo import load_v3_turbo_checkpoint
    from vieneu_lora import V3TurboLoraDataset, attach_lora, compute_loss, save_adapter
    from vieneu_lora.model import make_labels, IGNORE
    from vieneu_lora.lora import trainable_parameters, load_adapter
    if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported():
        raise ValueError('Pinned runner needs local CUDA with bfloat16 support; no CPU/cloud fallback')
    torch.manual_seed(CONFIG['dataset']['seed'])
    device = torch.device('cuda')
    t = CONFIG['training']
    tokenizer = AutoTokenizer.from_pretrained(str(base), subfolder=CONFIG['subfolder'], local_files_only=True, trust_remote_code=False)
    model = load_v3_turbo_checkpoint(str(base), subfolder=CONFIG['subfolder'], device=device, dtype=torch.float32)
    model.config.use_cache = False
    for p in model.parameters():
        p.requires_grad_(False)
    def loader(name, shuffle=False):
        rows = read_jsonl(dataset/(name+'.encoded.jsonl'))
        ds = V3TurboLoraDataset(rows, tokenizer, model.config, max_length=t['maxLength'])
        if len(ds) != len(rows):
            raise ValueError('Pinned tokenizer budget/row validation dropped data: '+name)
        return DataLoader(ds, batch_size=t['batchSize'], shuffle=shuffle, collate_fn=ds.collate, num_workers=0)
    def evaluate(loader_):
        model.eval()
        records = []
        torch.cuda.synchronize(); started = time.perf_counter()
        with torch.no_grad():
            for batch in loader_:
                size = len(batch['input_ids'])
                batch = {k: v.to(device) for k,v in batch.items()}
                with torch.autocast('cuda', dtype=torch.bfloat16):
                    loss, metrics = compute_loss(model, batch, t['textLossWeight'], t['audioLossWeight'])
                for key, value in dict(loss=loss.item(), **metrics).items():
                    if not math.isfinite(value):
                        raise ValueError('Non-finite held-out metric')
                text_labels, audio_labels = make_labels(batch, model.config)
                per_code = (audio_labels != IGNORE).sum(dim=(0, 1))
                if not torch.all(per_code == per_code[0]):
                    raise ValueError('Unequal audio-code target counts cannot use mean-codebook CE aggregation')
                records.append(dict(metrics, examples=size, textTargets=int((text_labels != IGNORE).sum()),
                    audioTargets=int(per_code.sum()), cb0Targets=int(per_code[0])))
        torch.cuda.synchronize()
        means = summarize_evaluation(records)
        means['teacherForcedSeconds'] = time.perf_counter()-started
        return means
    if args.action == 'evaluate':
        if not args.adapter:
            raise ValueError('--adapter required for paired base-versus-adapter evaluation')
        adapter = corpus.private_path(args.adapter)
        provenance = verify_adapter(adapter, ready, encoding)
        test_loader = loader('test')
        baseline = evaluate(test_loader)
        adapted = load_adapter(model, adapter)
        candidate = evaluate(test_loader)
        report = dict(base=baseline, adapter=candidate, datasetSha256=ready['datasetSha256'],
            baseRevision=CONFIG['baseRevision'], adapterSha256=corpus.sha(adapter/'adapter_model.safetensors'),
            heldoutLossImproved=candidate['loss'] < baseline['loss'], naturalnessImproved=None,
            synthesisLatencySeconds=None, listeningReviewRequired=True, deploymentReady=False,
            note='Teacher-forced latency/perplexity is diagnostic, not synthesis speed or a naturalness score')
        if args.render_comparison:
            from vieneu_lora.lora import merge_lora_into, export_merged
            import shutil
            merged = merge_lora_into(adapted)
            merged_dir = output/'merged-for-evaluation'
            if merged_dir.exists():
                raise ValueError('Use a fresh evaluation output directory')
            export_merged(merged, tokenizer, str(base), merged_dir, subfolder=CONFIG['subfolder'])
            # Keep pretrained notices with derived weights; no redistribution or activation.
            shutil.copyfile(upstream/'LICENSE', merged_dir/'VIENEU-LICENSE')
            shutil.copyfile(base/'README.md', merged_dir/'BASE-MODEL-CARD.md')
            model = None; adapted = None; merged = None
            torch.cuda.empty_cache()
            from vieneu import Vieneu
            import numpy as np
            import soundfile as sf
            enrollment = next((r for r in read_jsonl(dataset/'train.encoded.jsonl') if 3 <= r['duration'] <= 8), None)
            if enrollment is None:
                raise ValueError('Need a 3–8 second TRAIN clip for matched speaker enrollment')
            voice = dict(speaker_emb=np.asarray(enrollment['speaker_embedding'], dtype=np.float32), codes=None)
            examples = read_jsonl(dataset/'test.encoded.jsonl')[:5]
            receipts = []
            for condition, model_dir in (('base', base), ('adapter', merged_dir)):
                engine = Vieneu(mode='v3turbo', backend='pytorch', device='cuda', backbone_repo=str(model_dir), babble_retries=0)
                # Report warmed synthesis separately from model loading/first-call overhead.
                engine.infer(examples[0]['text'], voice=voice, temperature=.8)
                for i, row in enumerate(examples):
                    torch.manual_seed(CONFIG['dataset']['seed']+i)
                    torch.cuda.synchronize(); started = time.perf_counter()
                    audio = np.asarray(engine.infer(row['text'], voice=voice, temperature=.8), dtype=np.float32)
                    torch.cuda.synchronize(); elapsed = time.perf_counter()-started
                    if not len(audio) or not np.isfinite(audio).all():
                        raise ValueError('Invalid generated waveform')
                    target = output/f'heldout-{i+1}-{condition}.wav'
                    sf.write(str(target), audio, engine.sample_rate, subtype='PCM_16')
                    duration = len(audio)/engine.sample_rate
                    receipts.append(dict(id=f'heldout-{i+1}-{condition}', condition=condition, text=row['text'],
                        audio=str(target), audioSha256=corpus.sha(target), durationSeconds=duration,
                        synthesisSeconds=elapsed, realTimeFactor=elapsed/duration,
                        peak=float(np.max(np.abs(audio))), clippingFraction=float(np.mean(np.abs(audio) >= .999)),
                        status='needs_listening'))
                del engine
                import gc
                gc.collect(); torch.cuda.empty_cache()
            report['synthesisLatencySeconds'] = {condition: sum(r['synthesisSeconds'] for r in receipts if r['condition']==condition)/len(examples) for condition in ('base', 'adapter')}
            report['renderSettings'] = dict(temperature=.8, seed=CONFIG['dataset']['seed'], speed=1, warmed=True,
                enrollmentSource='train-only speaker embedding, same embedding and no reference codes for both conditions')
            report['samples'] = receipts
            review = dict(reviewer='', reviewedAt='', samples=[dict(id=r['id'], audioSha256=r['audioSha256'],
                heardText='', naturalness=None, southernAccent=None, pronunciation=None,
                offerAndNamesCorrect=None, notes='') for r in receipts])
            (output/'listening-review.template.json').write_text(json.dumps(review, ensure_ascii=False, indent=2), encoding='utf-8')
        (output/'base-vs-adapter.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
        print(json.dumps(report)); return
    if (output/'adapter').exists() or (output/'training.jsonl').exists():
        raise ValueError('Use a new output directory for each training run')
    if t['gradientCheckpointing']:
        # Frozen embedding inputs do not require gradients. Reentrant checkpoints
        # would lose LoRA gradients; non-reentrant mode supports these frozen inputs.
        model.semantic_backbone.gradient_checkpointing_enable(gradient_checkpointing_kwargs={'use_reentrant': False})
    l = CONFIG['lora']
    adapted = attach_lora(model, r=l['r'], alpha=l['alpha'], dropout=l['dropout'], target=l['target'])
    train_loader, val_loader = loader('train', True), loader('validation')
    parameters = list(trainable_parameters(model))
    optim = torch.optim.AdamW(parameters, lr=t['learningRate'], weight_decay=t['weightDecay'], betas=(.9, .95))
    steps = math.ceil(len(train_loader)/t['gradientAccumulation'])*t['epochs']
    scheduler = get_scheduler('cosine', optim, num_warmup_steps=max(1, math.ceil(steps*t['warmupRatio'])), num_training_steps=steps)
    best, stale = math.inf, 0
    provenance = dict(datasetSha256=ready['datasetSha256'], baseRevision=CONFIG['baseRevision'],
        upstreamRevision=CONFIG['upstreamRevision'], codecRevision=CONFIG['codecRevision'],
        configSha256=ready['configSha256'], encodedSplitHashes=encoding['files'],
        rawSplitHashes=ready['rawSplitHashes'], config=CONFIG)
    (output/'run.json').write_text(json.dumps(provenance, indent=2), encoding='utf-8')
    # Readiness is emitted only after the real model, adapters, every data split
    # needed for training, optimizer and scheduler have loaded successfully.
    (output/'launch-readiness.json').write_text(json.dumps(dict(trainingReady=True,
        evaluationReady=False, deploymentReady=False, datasetSha256=ready['datasetSha256'],
        baseRevision=CONFIG['baseRevision'], upstreamRevision=CONFIG['upstreamRevision'],
        note='Local training prerequisites loaded; successful training/quality still unproven'), indent=2), encoding='utf-8')
    with (output/'training.jsonl').open('x', encoding='utf-8') as log:
        initial = evaluate(val_loader)
        log.write(json.dumps(dict(epoch=0, validation=initial))+'\n'); log.flush()
        best = initial['loss']
        for epoch in range(t['epochs']):
            model.train(); optim.zero_grad(set_to_none=True)
            train_loss_sum, train_examples = 0., 0
            for i, batch in enumerate(train_loader):
                batch = {k: v.to(device) for k,v in batch.items()}
                # Scale the last partial accumulation group correctly.
                group_start = i//t['gradientAccumulation']*t['gradientAccumulation']
                group_size = min(t['gradientAccumulation'], len(train_loader)-group_start)
                with torch.autocast('cuda', dtype=torch.bfloat16):
                    loss, _ = compute_loss(model, batch, t['textLossWeight'], t['audioLossWeight'])
                if not torch.isfinite(loss):
                    raise ValueError('Non-finite training loss')
                size = len(batch['input_ids'])
                train_loss_sum += float(loss.item())*size
                train_examples += size
                (loss/group_size).backward()
                if (i+1)%t['gradientAccumulation'] == 0 or i+1 == len(train_loader):
                    torch.nn.utils.clip_grad_norm_(parameters, t['maxGradNorm'])
                    optim.step(); scheduler.step(); optim.zero_grad(set_to_none=True)
            validation = evaluate(val_loader)
            log.write(json.dumps(dict(epoch=epoch+1, trainingLossExampleMean=train_loss_sum/train_examples,
                validation=validation, learningRate=scheduler.get_last_lr()[0]))+'\n'); log.flush()
            if validation['loss'] < best-t['minDelta']:
                best, stale = validation['loss'], 0
                save_adapter(adapted, output/'adapter', tokenizer)
                provenance['adapterFiles'] = {name: corpus.sha(output/'adapter'/name)
                    for name in ('adapter_config.json', 'adapter_model.safetensors')}
                (output/'adapter/sakura-provenance.json').write_text(json.dumps(provenance, indent=2), encoding='utf-8')
            else:
                stale += 1
                if stale >= t['earlyStoppingPatience']:
                    break
    if not (output/'adapter').exists():
        raise ValueError('Validation did not improve over base; no adapter accepted')
    print(json.dumps(dict(adapter=str(output/'adapter'), needsHeldoutEvaluation=True, deployed=False)))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, ImportError, subprocess.SubprocessError) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(2)
