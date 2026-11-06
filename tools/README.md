# 50,000-puzzle corpus generation and acceptance

## Reproducible algorithm

Compile `g++ -std=c++17 -O3 tools/corpus.cpp -o corpus`.
`corpus generate N SEED SEED_DIRECTORY OUTPUT_DIRECTORY` writes N puzzles per tier and a ratings CSV. The seed directory uses 0.txt–4.txt and optional prevalidated extra3.txt/extra4.txt. These are puzzle boards, not solutions. Fixed random seeds and input seed files make an individual worker reproducible on the same standard-library implementation.

Candidates come from random complete-board generation followed by uniqueness-preserving clue removal, or from adding true clues and relocating/removing clues in existing puzzles. This is actual clue-set mutation, not filling quotas by renaming digits or rotating boards. Some generated puzzles share underlying solution structures. Each accepted puzzle is checked for exactly one solution, and all logic placements/eliminations are checked against that independently enumerated unique solution.

The full logical solver supports singles, hidden singles, locked candidates, naked/hidden pairs and triples, X-Wing, XY-Wing, Swordfish and XY chains up to length 10. The highest applied technique determines the starting tier; two effective Swordfish steps raise it to the top tier, matching the previous policy. Technique order remains a reproducible heuristic, not a proof of globally minimal logical difficulty. A chain search budget rejects unclassified puzzles; it never treats timeout as a hard rating.

## Binary-branch acceptance rule

The basic engine uses naked singles, hidden singles, locked candidates, naked pairs and hidden pairs, repeatedly to a fixed point. No triples, wings, fish or chains.

1. If basic logic finishes, cap the tier at 很难 (index 1).
2. Otherwise enumerate **every** bivalue cell at that fixed point. Choose its correct value (known from the already-verified unique solution), then run only basic logic to a fixed point again.
3. If any such branch finishes, cap the tier at 非常难 (index 2).
4. 超级难 and 无敌难 must have no zero- or one-branch successful path under this model, in addition to passing the original logical technique rating.

`binaryFloor: 2` means the successful binary-assumption depth has a proven lower bound of 2, **not** that exact depth is 2. It does not count failed branches, guesses explored, or DFS node visits. If no bivalue exists at the fixed point, there is no one-binary-assumption shortcut either; the original advanced logical solver must still solve it for inclusion. This is threshold-complete enumeration for the requested condition; a full DFS beyond depth 1 is unnecessary to prove the lower bound.

## Independent verification

`node tools/verify-corpus.mjs puzzles.json SHARD SHARDS` uses a separately implemented JavaScript solver. It checks unique solutions for every puzzle and **both** branches of every bivalue cell for both highest tiers. Any zero/one-branch completion rejects the release. The JS basic operation order differs from the generator's, providing another check against order-sensitive loopholes.

`tools/merge-corpus.py` checks global duplicates and a canonical key under digit relabeling and the eight geometric square symmetries. This does not claim full equivalence detection under every legal Sudoku row/band/column/stack permutation. Those transformations are not used to generate extra entries.

Only original clues are shipped in puzzles.json. Solutions and per-puzzle proof metrics are not needed by the game UI.

## Released bank reproduction

Use the tracked tools/seeds directory. Run four workers with N=3000 and random seeds 20262000, 20262001, 20262002, 20262003, each to a separate output directory. Then merge in that order:

```sh
python tools/merge-corpus.py --output corpus-merged worker0 worker1 worker2 worker3
node tools/verify-corpus.mjs corpus-merged/puzzles.json
```

The release merge caps each tier at 10,000 entries, producing exactly 50,000. Its board SHA-256 and aggregate demotions are recorded in corpus-report.json.
