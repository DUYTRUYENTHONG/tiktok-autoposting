"""Combine paired human listening scores with measured audio; never auto-deploy."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import unicodedata


def words(text):
    return re.findall(r'\w+', unicodedata.normalize('NFC', text).casefold())


def word_errors(reference, actual):
    ref, hyp = words(reference), words(actual)
    previous = list(range(len(hyp)+1))
    for i, expected in enumerate(ref, 1):
        current = [i]
        for j, heard in enumerate(hyp, 1):
            current.append(min(current[-1]+1, previous[j]+1, previous[j-1]+(expected != heard)))
        previous = current
    return previous[-1], len(ref)


def score(comparison, review):
    if not review.get('reviewer', '').strip():
        raise ValueError('Named listening reviewer required')
    reviewed_at = datetime.fromisoformat(review['reviewedAt'].replace('Z', '+00:00'))
    if reviewed_at.tzinfo is None or reviewed_at > datetime.now(timezone.utc):
        raise ValueError('Listening review requires a timezone-aware timestamp that is not in the future')
    results = {r['id']: r for r in review['samples']}
    samples = comparison['samples']
    if len({r['id'] for r in samples}) != len(samples):
        raise ValueError('Duplicate comparison sample IDs')
    if len(results) != len(review['samples']) or set(results) != {r['id'] for r in samples}:
        raise ValueError('Need one complete review for every paired sample')
    aggregate = {name: dict(errors=0, words=0, naturalness=[], southernAccent=[], pronunciation=[], offerAndNamesCorrect=True) for name in ('base', 'adapter')}
    pairs = {}
    for sample in samples:
        row = results[sample['id']]
        with Path(sample['audio']).open('rb') as f:
            digest = hashlib.file_digest(f, 'sha256').hexdigest()
        if digest != sample['audioSha256'] or row['audioSha256'] != digest:
            raise ValueError('Reviewed audio hash mismatch')
        totals = aggregate[sample['condition']]
        for metric in ('naturalness', 'southernAccent', 'pronunciation'):
            rating = row.get(metric)
            if type(rating) not in (int, float) or not math.isfinite(rating) or not 1 <= rating <= 5:
                raise ValueError('Human listening scores must be 1–5')
            totals[metric].append(rating)
        if not isinstance(row.get('offerAndNamesCorrect'), bool) or not row.get('heardText', '').strip():
            raise ValueError('Actual heard transcript and offer/name correctness required')
        totals['offerAndNamesCorrect'] &= row['offerAndNamesCorrect']
        errors, count = word_errors(sample['text'], row['heardText'])
        totals['errors'] += errors; totals['words'] += count
        pairs.setdefault(sample['id'].rsplit('-', 1)[0], []).append(sample)
    if not pairs or any(len(values) != 2 or {r['condition'] for r in values} != {'base', 'adapter'} for values in pairs.values()):
        raise ValueError('Listening comparison must be paired')
    if any(words(values[0]['text']) != words(values[1]['text']) for values in pairs.values()):
        raise ValueError('Paired listening samples must use the same reference text')
    for values in aggregate.values():
        values['wordErrorRate'] = values['errors']/max(1, values['words'])
        for metric in ('naturalness', 'southernAccent', 'pronunciation'):
            values[metric] = sum(values[metric])/len(values[metric])
    base, adapter = aggregate['base'], aggregate['adapter']
    return dict(metrics=aggregate, reviewer=review['reviewer'], reviewedAt=review['reviewedAt'],
        naturalnessImprovedOnReviewedSamples=adapter['naturalness'] > base['naturalness'],
        candidateForUserListening=(comparison['heldoutLossImproved'] and adapter['naturalness'] > base['naturalness']
            and adapter['southernAccent'] >= 4 and adapter['pronunciation'] >= 4
            and adapter['wordErrorRate'] <= base['wordErrorRate'] and adapter['offerAndNamesCorrect']),
        deploymentReady=False, note='Small reviewed sample only; user acceptance and supported inference hardware still required')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--comparison', type=Path, required=True)
    p.add_argument('--review', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--manifest', type=Path, required=True, help='Revalidate current human-speaker consent before processing voice derivatives')
    p.add_argument('--prepared', type=Path, required=True)
    a = p.parse_args()
    root = Path(__file__).resolve().parents[1]
    try:
        for path in (a.comparison, a.review, a.output):
            if root in path.resolve().parents:
                raise ValueError('Private listening data must stay outside the Git checkout')
        spec = importlib.util.spec_from_file_location('voice_corpus', root/'scripts/prepare-voice-training.py')
        corpus = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(corpus)
        ready = corpus.validate(a.manifest, a.prepared)
        comparison = json.loads(a.comparison.read_text(encoding='utf-8-sig'))
        if not ready['dataReady'] or comparison.get('datasetSha256') != ready['datasetSha256']:
            raise ValueError('Current consent/corpus does not match the evaluated voice; listening scoring blocked')
        result = score(comparison, json.loads(a.review.read_text(encoding='utf-8-sig')))
        a.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        p.exit(2, str(exc)+'\n')
