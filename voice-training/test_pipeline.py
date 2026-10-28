"""Synthetic technical fixtures only. These are NEVER human training recordings."""
from array import array
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('corpus', ROOT/'scripts/prepare-voice-training.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
score_spec = importlib.util.spec_from_file_location('listen_score', ROOT/'voice-training/score-listening.py')
scorer = importlib.util.module_from_spec(score_spec)
score_spec.loader.exec_module(scorer)
run_spec = importlib.util.spec_from_file_location('voice_runner', ROOT/'voice-training/run.py')
runner = importlib.util.module_from_spec(run_spec)
run_spec.loader.exec_module(runner)


class CorpusTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='sakura-voice-fixture-')
        self.home = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def wav(self, name='tone.wav', seconds=3, channels=1, width=2, rate=48000, silent=False, clipped=False):
        path = self.home/name
        values = array('h', (0 if silent else 32767 if clipped else int(5000*math.sin(i*2*math.pi*220/rate)) for i in range(int(rate*seconds))))
        with wave.open(str(path), 'wb') as f:
            f.setnchannels(channels); f.setsampwidth(width); f.setframerate(rate)
            f.writeframes(values.tobytes())
        return path

    def manifest(self, **overrides):
        evidence = self.home/'consent.txt'
        evidence.write_text('Test fixture: no real person or consent; NEVER train.', encoding='utf-8')
        self.wav()
        value = dict(schemaVersion=1, purpose='fixture-only', speakerId='fixture', accent='vi-VN-southern', gender='female',
                     consents=[dict(id='c', speakerId='fixture', adult=True, signedAt='2026-01-01', revoked=False,
                                    permittedUses=['tts-training', 'commercial-synthesis'], storage='local-only',
                                    evidence='consent.txt', evidenceSha256=m.sha(evidence))],
                     clips=[dict(id='fixture-1', audio='tone.wav', text='Đây là âm thanh kiểm tra kỹ thuật.', sourceKind='synthetic', sourceId='source1',
                                 sessionId='session1', textGroup='group1', speakerId='fixture', consentId='c',
                                 transcriptReviewed=True, cleanSpeechReviewed=True)])
        value.update(overrides)
        path = self.home/'corpus.json'
        path.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
        return path, value

    def test_lossless_audio_statistics(self):
        stats = m.audio_stats(self.wav())
        self.assertEqual(stats['duration'], 3)
        self.assertGreater(stats['rms'], .1)
        self.assertEqual(stats['clippingFraction'], 0)

    def test_silence_and_clipping_rejected(self):
        for name, options in [('silence.wav', dict(silent=True)), ('clipped.wav', dict(clipped=True))]:
            with self.assertRaisesRegex(ValueError, 'Silence/level/clipping'):
                m.audio_stats(self.wav(name, **options))

    def test_duration_and_format_rejected(self):
        for name, options in [('short.wav', dict(seconds=2)), ('rate.wav', dict(rate=24000))]:
            with self.assertRaises(ValueError):
                m.audio_stats(self.wav(name, **options))

    def test_private_data_cannot_live_in_checkout(self):
        with self.assertRaisesRegex(ValueError, 'outside the Git'):
            m.private_path(ROOT/'voice-training/private-corpus.json')

    def test_missing_corpus_yields_honest_readiness(self):
        report = m.validate(self.home/'missing.json', self.home/'prepared')
        self.assertFalse(report['dataReady'])
        self.assertFalse(report['trainingReady'])
        self.assertFalse(report['deploymentReady'])
        self.assertIsNone(report['naturalnessImprovement'])

    def test_synthetic_fixture_never_qualifies(self):
        path, _ = self.manifest()
        report = m.validate(path, self.home/'prepared')
        self.assertFalse(report['dataReady'])
        self.assertTrue(any('synthetic' in error for error in report['errors']))
        self.assertNotIn('datasetDirectory', report)

    def test_revoked_or_tampered_consent_rejected(self):
        path, value = self.manifest()
        value['consents'][0]['revoked'] = True
        path.write_text(json.dumps(value), encoding='utf-8')
        report = m.validate(path, self.home/'prepared')
        self.assertTrue(any('permission' in error for error in report['errors']))
        value['consents'][0]['revoked'] = False
        (self.home/'consent.txt').write_text('changed', encoding='utf-8')
        path.write_text(json.dumps(value), encoding='utf-8')
        report = m.validate(path, self.home/'prepared')
        self.assertTrue(any('hash mismatch' in error for error in report['errors']))

    def test_bad_transcript_and_duplicate_audio_rejected(self):
        path, value = self.manifest()
        # Artificial declarations exercise validation only: fixture-only stays blocked.
        value['clips'][0]['sourceKind'] = 'human-recording'
        duplicate = dict(value['clips'][0], id='fixture-2', text='Tấm vải xanh được đặt trên bàn nhỏ.')
        value['clips'].append(duplicate)
        path.write_text(json.dumps(value), encoding='utf-8')
        report = m.validate(path, self.home/'prepared')
        self.assertTrue(any('Duplicate transcript or decoded PCM' in error for error in report['errors']))
        value['clips'][0]['text'] = 'a|b'
        path.write_text(json.dumps(value), encoding='utf-8')
        report = m.validate(path, self.home/'prepared')
        self.assertTrue(any('Transcript needs' in error for error in report['errors']))

    def test_grouped_holdout_is_deterministic_and_disjoint(self):
        texts = ['Chiều nay trời mưa lớn ngoài bến xe.', 'Người bán đặt cái khay màu xanh lên bàn.',
                 'Mấy đứa nhỏ cười vui trong sân trường.', 'Căn bếp thơm mùi cơm mới vừa nấu.',
                 'Cô ấy mở cửa để đón ánh nắng sớm.', 'Con mèo ngủ yên bên cạnh chậu hoa.']
        rows = [dict(id=str(i), text=text, sessionId=str(i), sourceId='source'+str(i), textGroup='family'+str(i)) for i, text in enumerate(texts)]
        rows[1]['sessionId'] = rows[0]['sessionId']
        rows[3]['textGroup'] = rows[2]['textGroup']
        splits = m.split_rows(rows)
        self.assertEqual(splits, m.split_rows(rows))
        self.assertEqual(sum(map(len, splits.values())), 6)
        locations = {r['id']: name for name, values in splits.items() for r in values}
        self.assertEqual(locations['0'], locations['1'])
        self.assertEqual(locations['2'], locations['3'])
        self.assertEqual(set(locations.values()), {'train', 'validation', 'test'})

    def test_near_duplicates_cannot_cross_holdout(self):
        rows = [dict(id=str(i), text=text, sessionId=str(i), sourceId=str(i), textGroup=str(i)) for i, text in enumerate([
            'Chị lau chiếc bàn nhỏ sau khi nấu bữa cơm chiều.',
            'Chị lau chiếc bàn nhỏ sau khi nấu bữa cơm tối.',
            'Ngoài đồng lúa chín vàng trải rộng dưới ánh nắng.',
            'Đi qua bến xe đông đúc vào lúc tan tầm.'])]
        result = m.split_rows(rows)
        where = {r['id']: name for name, values in result.items() for r in values}
        self.assertEqual(where['0'], where['1'])
        with self.assertRaisesRegex(ValueError, 'three independent'):
            m.split_rows(rows[:2])

    def test_listening_word_error_rate(self):
        self.assertEqual(scorer.word_errors('Mua một tặng một.', 'Mua một tặng một'), (0, 4))
        self.assertEqual(scorer.word_errors('Mua một tặng một.', 'Mua hai tặng một'), (1, 4))

    def test_paired_listening_scores_require_actual_hashed_audio(self):
        audio = self.wav()
        samples = [dict(id='heldout-1-'+condition, condition=condition, text='Mua một tặng một.',
                        audio=str(audio), audioSha256=m.sha(audio)) for condition in ('base', 'adapter')]
        review = dict(reviewer='Fixture reviewer', reviewedAt='2026-10-28T00:00:00Z', samples=[
            dict(id=r['id'], audioSha256=r['audioSha256'], heardText=r['text'],
                 naturalness=3 if r['condition']=='base' else 4, southernAccent=4, pronunciation=4,
                 offerAndNamesCorrect=True) for r in samples])
        result = scorer.score(dict(samples=samples, heldoutLossImproved=True), review)
        self.assertTrue(result['candidateForUserListening'])
        self.assertFalse(result['deploymentReady'])
        review['samples'][0]['audioSha256'] = 'changed'
        with self.assertRaisesRegex(ValueError, 'hash mismatch'):
            scorer.score(dict(samples=samples, heldoutLossImproved=True), review)

    def test_malformed_schema_stays_unready(self):
        path = self.home/'bad.json'
        path.write_text('[1,2]', encoding='utf-8')
        self.assertFalse(m.validate(path, self.home/'prepared')['dataReady'])

    def test_empty_consent_evidence_rejected(self):
        path, value = self.manifest()
        evidence = self.home/'consent.txt'
        evidence.write_bytes(b'')
        value['consents'][0]['evidenceSha256'] = m.sha(evidence)
        path.write_text(json.dumps(value), encoding='utf-8')
        report = m.validate(path, self.home/'prepared')
        self.assertTrue(any('cannot be empty' in error for error in report['errors']))

    def test_windows_filename_collisions_rejected(self):
        path, value = self.manifest()
        value['clips'].append(dict(value['clips'][0], id='FIXTURE-1'))
        value['clips'].append(dict(value['clips'][0], id='CON'))
        path.write_text(json.dumps(value), encoding='utf-8')
        report = m.validate(path, self.home/'prepared')
        self.assertEqual(sum('filename-safe' in error for error in report['errors']), 2)

    def encoded_fixture(self):
        # Codec/provenance plumbing fixtures: no real human corpus or trained weights.
        raw_hashes, encoded_hashes = {}, {}
        for name in ('train', 'validation', 'test'):
            raw = self.home/(name+'.jsonl')
            encoded = self.home/(name+'.encoded.jsonl')
            raw.write_text(json.dumps(dict(id='fixture-'+name, text='Đây là kiểm tra '+name))+ '\n', encoding='utf-8')
            encoded.write_text(json.dumps(dict(file_name='fixture-'+name+'.wav', text='Đây là kiểm tra '+name))+ '\n', encoding='utf-8')
            raw_hashes[name] = m.sha(raw)
            encoded_hashes[name] = m.sha(encoded)
        ready = dict(datasetSha256='fixture-only', configSha256='fixture-config', rawSplitHashes=raw_hashes)
        encoding = dict(ready, files=encoded_hashes, baseRevision=runner.CONFIG['baseRevision'],
                        codecRevision=runner.CONFIG['codecRevision'], upstreamRevision=runner.CONFIG['upstreamRevision'])
        return ready, encoding

    def test_encoded_holdout_membership_cannot_be_relabelled(self):
        ready, encoding = self.encoded_fixture()
        runner.verify_encoded_splits(self.home, encoding, ready)
        encoded = self.home/'test.encoded.jsonl'
        encoded.write_text(json.dumps(dict(file_name='fixture-train.wav', text='Đây là kiểm tra train'))+'\n', encoding='utf-8')
        encoding['files']['test'] = m.sha(encoded)
        with self.assertRaisesRegex(ValueError, 'membership/holdout leakage'):
            runner.verify_encoded_splits(self.home, encoding, ready)

    def test_encoded_transcripts_and_policy_are_bound(self):
        ready, encoding = self.encoded_fixture()
        encoded = self.home/'train.encoded.jsonl'
        row = json.loads(encoded.read_text(encoding='utf-8'))
        row['text'] = 'Nội dung đã thay đổi.'
        encoded.write_text(json.dumps(row)+'\n', encoding='utf-8')
        encoding['files']['train'] = m.sha(encoded)
        with self.assertRaisesRegex(ValueError, 'transcript changed'):
            runner.verify_encoded_splits(self.home, encoding, ready)
        encoding['configSha256'] = 'older-policy'
        with self.assertRaisesRegex(ValueError, 'configSha256'):
            runner.verify_encoded_splits(self.home, encoding, ready)

    def test_prepared_split_mutation_is_detected(self):
        ready, encoding = self.encoded_fixture()
        original = self.home/'test.jsonl'
        original.write_text(original.read_text(encoding='utf-8')+'\n', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'original split changed'):
            runner.verify_encoded_splits(self.home, encoding, ready)

    def test_adapter_weights_and_config_are_bound(self):
        ready, encoding = self.encoded_fixture()
        adapter = self.home/'adapter'
        adapter.mkdir()
        for name in ('adapter_config.json', 'adapter_model.safetensors'):
            (adapter/name).write_text('fixture bytes, not actual model weights', encoding='utf-8')
        provenance = dict(datasetSha256=ready['datasetSha256'], baseRevision=runner.CONFIG['baseRevision'],
            upstreamRevision=runner.CONFIG['upstreamRevision'], codecRevision=runner.CONFIG['codecRevision'],
            configSha256=ready['configSha256'], encodedSplitHashes=encoding['files'],
            rawSplitHashes=ready['rawSplitHashes'], config=runner.CONFIG,
            adapterFiles={name: m.sha(adapter/name) for name in ('adapter_config.json', 'adapter_model.safetensors')})
        (adapter/'sakura-provenance.json').write_text(json.dumps(provenance), encoding='utf-8')
        runner.verify_adapter(adapter, ready, encoding)
        (adapter/'adapter_model.safetensors').write_text('changed', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
            runner.verify_adapter(adapter, ready, encoding)

    def test_perplexity_aggregation_weights_target_tokens(self):
        records = [dict(text_loss=1., audio_loss=2., acc_cb0=.2, textTargets=1, audioTargets=16, cb0Targets=1, examples=1),
                   dict(text_loss=3., audio_loss=4., acc_cb0=.8, textTargets=3, audioTargets=48, cb0Targets=3, examples=1)]
        result = runner.summarize_evaluation(records)
        self.assertEqual(result['text_loss'], 2.5)
        self.assertEqual(result['audio_loss'], 3.5)
        self.assertAlmostEqual(result['acc_cb0'], .65)
        self.assertAlmostEqual(result['textPerplexity'], math.exp(2.5))

    def test_listening_requires_unique_samples_and_matching_scripts(self):
        audio = self.wav()
        samples = [dict(id='heldout-1-'+condition, condition=condition, text='Mua một tặng một.',
                        audio=str(audio), audioSha256=m.sha(audio)) for condition in ('base', 'adapter')]
        review = dict(reviewer='Fixture reviewer', reviewedAt='2026-10-28T00:00:00Z', samples=[
            dict(id=r['id'], audioSha256=r['audioSha256'], heardText=r['text'], naturalness=4,
                 southernAccent=4, pronunciation=4, offerAndNamesCorrect=True) for r in samples])
        with self.assertRaisesRegex(ValueError, 'Duplicate comparison'):
            scorer.score(dict(samples=samples+[samples[0]], heldoutLossImproved=True), review)
        samples[1]['text'] = 'Nội dung hoàn toàn khác.'
        with self.assertRaisesRegex(ValueError, 'same reference text'):
            scorer.score(dict(samples=samples, heldoutLossImproved=True), review)

    def test_listening_cli_revalidates_current_consent(self):
        manifest, _ = self.manifest()
        comparison, review = self.home/'comparison.json', self.home/'review.json'
        comparison.write_text(json.dumps(dict(datasetSha256='fixture-only')), encoding='utf-8')
        review.write_text('{}', encoding='utf-8')
        result = subprocess.run([sys.executable, str(ROOT/'voice-training/score-listening.py'),
            '--manifest', str(manifest), '--prepared', str(self.home/'prepared'),
            '--comparison', str(comparison), '--review', str(review), '--output', str(self.home/'score.json')],
            capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 2)
        self.assertIn('Current consent/corpus', result.stderr)
        self.assertFalse((self.home/'score.json').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
