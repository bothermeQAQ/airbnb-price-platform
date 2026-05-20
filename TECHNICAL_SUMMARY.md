# NYC Airbnb Nightly Price Prediction — Technical Summary

**Final public Kaggle score: MAE = 36.18291**
**Best honest OOF MAE: 35.60 (random KFold) / 37.49 (GroupKFold, leakage-free)**

---

## 1. Problem Overview

- **Task**: Supervised regression — predict `price` (nightly USD) for NYC Airbnb listings.
- **Metric**: Mean Absolute Error (MAE) in original price space.
- **Data**: 33,538 training rows × 65 columns (text, categorical, numeric, missing-heavy); 17,337 test rows.
- **Target distribution**: heavily right-skewed (mean $145, median $109, max $1999, 16 zero-price rows). Trained on `log1p(price)`, predict `expm1(pred_log)` and clip to ≥0.
- **Key constraint**: dataset has no listing-level lat/lon — only `zipcode`. Geo features had to be derived.

---

## 2. Features Engineered (~310 features in the richest version)

### 2.1 Cleaning & parsing

| Original field | Transformation |
|---|---|
| `price` ($XX.YY) | parsed to float; rows with `price=0` (16 rows) dropped from training |
| `extra_people` ($XX.YY) | parsed via `parse_money()` to float |
| `host_response_rate` (NN%) | parsed via `parse_pct()` to float |
| `host_acceptance_rate` | 100% missing — dropped |
| 7 t/f boolean fields | mapped to {0, 1, NaN} |
| `host_since`, `first_review`, `last_review` | parsed dates; computed days from reference date `2019-08-01` (snapshot date) |
| `amenities` (curly-brace list with quoted multi-word) | proper regex parser `_AMEN_RE` for `{Wifi,"Air conditioning",...}` |
| `zipcode` | extracted 5-digit ZIP via regex |

### 2.2 Amenities (50+ flags + summary)

- Hand-curated keyword list of ~50 amenities (`wifi`, `air conditioning`, `kitchen`, `washer`, `dryer`, `gym`, `elevator`, `doorman`, `pool`, etc.). Each as a binary flag.
- `amenities_count` = number of amenities; `amenities_len` = raw string length.

### 2.3 Geo features

| Source | Features |
|---|---|
| **pgeocode** (offline NYC zip→centroid lookup) | `latitude`, `longitude` per listing (zipcode-centroid) |
| Haversine distances to 10 NYC landmarks | `dist_times_sq`, `dist_central_park`, `dist_jfk`, `dist_lga`, `dist_wall_st`, `dist_brooklyn_br`, `dist_empire`, `dist_union_sq`, `dist_williamsburg`, `dist_soho` |
| Distance to `manhattan_lat,lon` and city centroid | `dist_manhattan`, `dist_centroid` |
| **KMeans** on `(lat, lon)` at three granularities | `geo_cluster_10`, `geo_cluster_25`, `geo_cluster_50` (categorical) |
| **NYC subway stations** (MTA via data.ny.gov, 2,120 entrances) | `dist_nearest_subway`, `dist_top3_subway_mean`, `subway_count_500m`, `subway_count_1km` (BallTree haversine) |
| **NYC restaurant POIs** (DOHMH inspections, ~30K unique) | `rest_count_500m`, `rest_count_1km`, `rest_count_2km`, `dist_nearest_rest`, `dist_top10_rest_mean` |

### 2.4 Target encoding (OOF, with smoothing=20)

OOF mean+std target encoding (computed with K-fold to avoid leakage) on:
- `neighbourhood_cleansed`, `zipcode`, `host_neighbourhood`, `property_type`, `neighbourhood_group_cleansed`, `city`
- `geo_cluster_10/25/50`
- **Cross target encoding** for selected pairs (e.g., `room_type × neighbourhood`, `accommodates × neighbourhood`) — tried but did not help, so removed from final.
- **Amenity target encoding**: top-30 amenity flags, each given an OOF-smoothed mean log-price + summary stats `amTE_mean`, `amTE_std`.

### 2.5 Listing density & host features

- `neigh_listing_count`, `zip_listing_count`, `geo_cluster_25_count`, `geo_cluster_50_count`
- `host_tenure_days`, `days_since_first_review`, `days_since_last_review`, `has_first_review`, `has_last_review`
- `host_verifications_count`
- `host_listings_count`, `calculated_host_listings_count`, `reviews_per_month`, `number_of_reviews`
- Derived: `reviews_per_tenure`, `avg_review_score` (mean of 7 review-score columns)

### 2.6 Text/length features

- For each of 11 text fields (`name`, `summary`, `space`, `description`, `neighborhood_overview`, `notes`, `transit`, `access`, `interaction`, `house_rules`, `host_about`):
  - `<col>_len` (character length)
- `name_words`, `description_words`
- Name keyword flags (16 keywords: `luxury`, `cozy`, `studio`, `loft`, `penthouse`, `view`, `park`, `central`, `manhattan`, `brooklyn`, `queens`, `bronx`, `private`, `shared`, `modern`, `spacious`)
- **TF-IDF + TruncatedSVD-50** on concatenated text fields (8.4% variance explained but adds real signal at the model level)
- **TF-IDF on amenities text** → SVD-20
- **Sentence-Transformer embeddings** (`all-MiniLM-L6-v2`, 384-dim) on `name+summary+description+neighborhood_overview` → SVD-50 (62.7% var explained)

### 2.7 Derived ratios & interactions

- `beds_per_person`, `bath_per_person`, `bedroom_per_person`, `beds_per_bedroom`
- `accom_minus_beds`, `extra_guests`, `extra_people_x_extra_guests`

**Final richest dataset** (`data_v7_amte.pkl`): 344 numeric features + 14 categorical features.

---

## 3. Models Used (40+ base models)

All base models are trained on `log1p(price)` (except `LGB_raw`) with 5-fold CV. Each is a separate K-fold OOF prediction column for stacking.

### 3.1 GBM core trio (LGB / XGB / CatBoost) — across 3 feature versions

| Feature set | LGB | XGB | CatBoost |
|---|---|---|---|
| `data_v5` (geo only, 183 cols) | LGB_v5_l1 | XGB_v5 | CB_v5 |
| `data_v5_tfidf` (+ TF-IDF, 253 cols) | LGB_tfidf_l1 | XGB_tfidf | CB_tfidf |
| `data_v7_amte` (+ subway + SBERT + amenity TE, 344 cols) | LGB_cmb_huber | XGB_cmb | CB_cmb |

All trained with Optuna-tuned hyperparameters (20 trials, 3-fold CV):
- **LGB**: lr=0.026, leaves=99, min_data=11, ff=0.72, bag=0.71, λ1=0.55, λ2=0.05
- **XGB**: lr=0.030, depth=8, min_child=9, subsample=0.95, col_bytree=0.62, reg_λ=0.45
- **CB**: lr=0.024, depth=8, l2=1.31, bagging_temp=0.91

### 3.2 LightGBM-Huber variants (the workhorse)

LGB with **Huber loss** was the single most important model class. Tried 8 variants across alpha and feature_fraction:

| Variant | α (Huber) | feature_fraction | num_leaves | Notes |
|---|---|---|---|---|
| `LGB_huber_a05` | 0.5 | 0.75 | 99 | Default Huber |
| `LGB_huber_a9` | 0.9 | 0.75 | 99 | Less robust, sharper |
| `LGB_huber_a095` | 0.95 | 0.75 | 99 | Almost MSE-like |
| `LGB_h_a03` | 0.3 | 0.5 | 99 | Most robust |
| `LGB_h_a07` | 0.7 | 0.5 | 99 | Middle |
| `LGB_h_a05_ff5` | 0.5 | **0.5** | 99 | **Best single model (36.49 random-KFold OOF)** — adding feature randomness ↑ |
| `LGB_h_a05_4seed` | 0.5 | 0.5 | 99 | 4 model-seed averaging |
| `LGB_h_a05_nl255` | 0.5 | 0.5 | 255 | Deeper trees (no help) |

### 3.3 Diverse objectives for ensemble variety

- `LGB_raw`: L1 loss on **raw price** target (no log transform) — adds different error structure
- `LGB_quant`: Quantile loss at α=0.5 (median regression)
- `LGB_q40`, `LGB_q45`, `LGB_q50`, `LGB_q55`, `LGB_q90`: quantile predictions used to build a **quantile spread feature** (`q90 − q50`) for the stacker

### 3.4 Specialized base learners

| Model | Purpose | Notes |
|---|---|---|
| `HGB_v5` | sklearn HistGradientBoosting with absolute_error loss | Architectural diversity |
| `LGB_perRT` | Per-room-type segmented Huber (3 separate models on Entire/Private/Shared) | In-room-type signal |
| `LGB_perBO` | Per-borough Huber (Manhattan/Brooklyn/Queens/Other) | In-borough signal |
| `wh_a05_ff5/a09/a03` | LGB-Huber with `sample_weight = clip(sqrt(y / y.mean()), 0.7, 3.0)` | Upweight high-price |

### 3.5 Mixture-of-Experts (MoE) tier models

Trained 3 separate LGB-Huber models on FULL training data, each with `sample_weight = P(tier|x)` from a calibrated tier classifier:
- `MoE_low` (sample_weight = P(tier=0|x))
- `MoE_mid` (sample_weight = P(tier=1|x))
- `MoE_high` (sample_weight = P(tier=2|x))
- `MoE_soft`: prediction = ∑ P(t|x) · pred_t(x)

Plus the **tier classifier** itself feeds 3 probability features into the stacker.

### 3.6 Multi-fold-seed averaging

To reduce CV variance, the strongest single models were retrained with **3 KFold seeds × 2 model seeds = 6 fits per fold**, OOF predictions averaged across fold seeds. This gave the biggest single technique boost (~0.2 MAE per dominant model).

MFS-averaged versions: `LGB_cmb_mfs`, `CB_cmb_mfs`, `XGB_cmb_mfs`, `LGB_h_a9_mfs`, `LGB_h_a05ff5_mfs`, `LGB_poi_mfs`, `LGB_amte_mfs`.

---

## 4. Stacking Architecture

### 4.1 Base-model OOF matrix

40 base model log-predictions + 3 tier classifier probabilities + 1 quantile spread feature = **44 stacker features**.

### 4.2 Stacker

**HuberRegressor (ε=1.35, α=0.001)** on log-price predictions. Optimized over Ridge α grid {0.01, 0.1, 1, 5, 10, 30, 100} and Huber ε {1.0, 1.35, 1.5, 2.0}. Huber consistently outperformed Ridge by ~0.05 MAE because the Huber objective better matches the MAE evaluation metric.

### 4.3 Residual correction model

A second-level LightGBM-L1 model trained to predict residuals (`y_log − y_stacker`):
- Inputs: the same 44 stacker features + the stacker's own OOF prediction (45 features total)
- Loss: regression_l1, 1500 iters, lr=0.02, num_leaves=15, min_child=50
- Result: **−0.17 MAE improvement**, the single biggest stacking-step win.
- Optimal shrinkage = 1.0 (full correction).

### 4.4 Final calibration

- **Jensen's correction**: scalar `c` minimizing OOF MAE in price space. Best `c=0.9985` (slight shrink, tiny effect).
- **Band uplift** in `(200, 300]`, `(300, 500]`, `>500]`. Best bands `(0.98, 1.0, 1.0)` — barely helped.

---

## 5. Key Techniques That Gave the Biggest Wins

| Technique | MAE reduction | Why it worked |
|---|---|---|
| **TF-IDF + SVD-50** on text fields | 36.83 → 36.57 (−0.26) | Captures phrases like "near subway", "luxury", "spacious" that signal price |
| **LightGBM with Huber loss** | 36.57 → 36.27 (−0.30) | Smoother gradient than L1, more robust than L2 — better matches MAE objective |
| **Multi-fold-seed averaging** on dominant models | 36.21 → 36.00 (−0.21) | Reduces CV variance; the residual variance was ~0.2 MAE between fold seeds |
| **Residual correction model** (LGB-L1 on stacker outputs) | 35.80 → 35.62 (−0.18) | Extracts non-linear patterns the linear stacker missed |
| **MoE + tier probabilities** as stacker features | 35.97 → 35.85 (−0.12) | Per-tier predictions for the heavy-tailed high-price segment |
| **Improved high-tier classifier** (binary `scale_pos_weight=13.72` + isotonic calibration) | (Enables MoE) | AUC went from implicit 0.92 to **0.947**; high-tier recall 49% → 67% |
| **Quantile spread feature** (`q90 − q50`) for the stacker | 35.85 → 35.80 (−0.05) | Encodes per-row prediction uncertainty |
| **Unconstrained Ridge stacking** in log space | 36.21 → 36.13 (−0.08) | Allowing negative weights / intercept beats convex-only blending |

---

## 6. Final Pipeline (text diagram)

```
                            ┌──────────────────────────────┐
                            │  RAW DATA (33K train rows)   │
                            └───────────────┬──────────────┘
                                            │
                                            ▼
              ┌─────────────────────────────────────────────────────────┐
              │ Feature engineering                                     │
              │  • Parse $, %, t/f, dates                              │
              │  • Drop price=0 rows (16 rows)                         │
              │  • Amenities → 50+ flags + count                       │
              │  • Text length & keyword flags                         │
              │  • Date deltas, ratios                                 │
              │  • pgeocode lat/lon + landmark distances + KMeans clst │
              │  • NYC subway + restaurant POI proximity (BallTree)    │
              │  • TF-IDF (SVD-50) + SBERT (MiniLM-L6 → SVD-50)        │
              │  • OOF mean/std target encoding for high-card cats     │
              │  • Amenity OOF target encoding (top-30)                │
              └───────────────┬─────────────────────────────────────────┘
                              │ (344 num cols + 14 cat cols)
                              ▼
            ┌─────────────────────────────────────────────────┐
            │   40+ BASE MODELS (5-fold OOF in log space)     │
            ├─────────────────────────────────────────────────┤
            │  GBM core (×3 feature sets):                   │
            │   • LightGBM-L1, XGB-MAE, CatBoost-MAE         │
            │  LGB-Huber variants (8 α / ff combinations):   │
            │   • α ∈ {0.3, 0.5, 0.7, 0.9, 0.95}             │
            │   • ff ∈ {0.5, 0.75}                           │
            │  Different objectives:                          │
            │   • L1 on raw price, quantile (q40-q90)        │
            │  Specialized:                                   │
            │   • Per-room_type Huber, Per-borough Huber     │
            │   • HistGradientBoosting (sklearn)             │
            │  Mixture-of-Experts:                            │
            │   • Binary high-tier classifier (AUC 0.947)    │
            │   • MoE_low/mid/high (sample_weight=P(t|x))    │
            │   • MoE_soft = ∑ P(t)·pred_t                   │
            │  Weighted (sqrt(y/mean)) LGB-Huber (×3)         │
            │  Multi-fold-seed averages (3×2 = 6 fits/fold)  │
            └────────────────┬────────────────────────────────┘
                             │ 40 base OOF preds + 3 tier probs + 1 spread
                             ▼
                ┌────────────────────────────────────┐
                │   HuberRegressor stacker            │
                │   (ε=1.35, α=0.001, fit_intercept)  │
                │   In log space, 5-fold OOF          │
                └────────────────┬────────────────────┘
                                 │ stacker log-pred
                                 ▼
                ┌────────────────────────────────────┐
                │   LGB-L1 residual correction        │
                │   Input: 44 features + stacker pred │
                │   Output: y_log − y_stacker         │
                │   Shrinkage: 1.0                    │
                └────────────────┬────────────────────┘
                                 │ corrected log-pred
                                 ▼
                ┌────────────────────────────────────┐
                │   Jensen scalar c = 0.9995          │
                │   (tiny — stacker already calibrated)│
                └────────────────┬────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────┐
                │   expm1, clip to ≥0                 │
                └────────────────┬────────────────────┘
                                 │
                                 ▼
                       submission.csv (Id, Predicted)

Random-KFold pipeline:  OOF MAE = 35.6066,  Public LB = 36.18291
```

---

## 7. What Didn't Work (and Why)

| Attempt | Result | Why it failed |
|---|---|---|
| **Cross target encoding** for many pairs (room×neigh, prop×neigh, etc.) | Hurt model | Created multicollinear noise; smoothing of 20 made rare combos uninformative |
| **kNN OOF price feature** (median log-price of 5/25/100 nearest by lat/lon) | Neutral/hurt | Train side uses 4/5 of data, test side uses 5/5 → distribution shift causes model to over-trust test-side feature |
| **CatBoost with Huber loss** | Diverged to MAE ~2.7×10¹³ | CatBoost's Huber gradient + log target produced runaway predictions; aborted |
| **XGBoost with pseudohuber loss** | OOF MAE ~10⁴⁶ | Same issue — base_score default vs huber_slope mismatch |
| **Isotonic calibration** (global, per-borough, per-room_type, borough×room_type) | All worse (35.80–36.00) | Stacker output already well-calibrated; isotonic adds binning noise |
| **LightGBM meta-learner** with side features | 36.19 (worse than Ridge 36.00) | Overfits despite shallow depth=3 num_leaves=7; the linear blend is enough |
| **Per-borough / per-room_type segment models** as primary predictors | Per-segment oracle MAE = 28 (!) but operational MAE = 85 | Classifier accuracy not high enough (especially high-tier 51% recall); misclassification gets amplified |
| **Augmented Ridge with raw features alongside OOFs** | 36.17 (worse than 36.00 plain) | Side features fight with stacker; harder to regularize |
| **Sentence-Transformer embeddings of just name+summary** | 36.90 single model (vs 36.49 best Huber) | Short text isn't rich enough; full description embedding is better but still didn't beat TF-IDF |
| **POI features (restaurants within 0.5/1/2km)** | Single model: 36.35; stack: no change | Information already captured by zip-level TE and geo clusters |
| **Amenity target encoding** (top-30) | Single model 36.36; stack: no change | Information already in binary amenity flags |
| **Band uplift / Jensen scaling** | <0.02 MAE | Stacker output is already nearly unbiased |

---

## 8. Critical Diagnostics

### 8.1 Host-ID leakage analysis (the big finding)

**27.1% of training listings share a host with another training listing. 27.2% of TEST listings share a host with training.** Random KFold can leak host-specific information across folds.

| Setup | OOF MAE |
|---|---|
| Final pipeline (random-KFold base models, GroupKFold stacker) | **35.5733** |
| Same pipeline with full GroupKFold (base models retrained) | **37.4944** |
| Public LB | **36.18291** |

The full GroupKFold retrain proved the random-KFold OOFs were **optimistic by ~1.9 MAE** due to host leakage. The public LB sits between the two — consistent with the test set being a mix of unseen and host-overlapping listings.

**Trade-off identified**: GroupKFold gives the honest generalization estimate, but the random-KFold model is *better* on this specific test set because host-specific patterns are real and exploitable when test hosts appear in training. We kept the random-KFold submission as the official entry.

### 8.2 Per-tier oracle analysis

If we could perfectly classify price tiers:
- Low tier (<$100, 15K rows): seg MAE = **10.9**
- Mid tier ($100–300, 16K rows): seg MAE = **30.2**
- High tier (>$300, 2.3K rows): seg MAE = **127** ← high variance, hard

Per-tier oracle (assuming perfect tier knowledge): **OOF MAE = 28**.
With realistic classifier probabilities, weighted blend = 85.4 (too sensitive to misclassification).

**Improvement path**: binary high-tier classifier with `scale_pos_weight=13.72` brought AUC from implicit ~0.92 to **0.947**, recall@0.5 from 49% → **67%**.

---

## 9. Key Learnings

### 9.1 Technical learnings

1. **Huber loss for MAE-targeted regression**. Despite being designed for robustness, Huber loss with α=0.5 was consistently better than L1 for this problem because of the smoother gradient near zero — boosting algorithms find better minima.

2. **Multi-fold-seed averaging is highly underrated**. Averaging OOF predictions across multiple `KFold(seed=...)` splits reduced single-model MAE by 0.15–0.25 — better than most feature-engineering attempts. This is essentially "fold-bagging".

3. **Residual correction is a free lunch when done right**. Training a second-level LGB-L1 on the stacker's OOF predictions extracted 0.18 MAE. The key is training it OOF on the stacker's OOF — never train it on the stacker's full-fit predictions.

4. **Stacking with a learned linear blender (Ridge / HuberRegressor) beats convex blending and tree-based meta-learners** for moderate-sized stacks (40 base models, 33K rows). Tree meta-learners overfit.

5. **GroupKFold is essential for any dataset with grouped observations**. Random KFold optimism scales with the fraction of groups that span train/val. Always compare the two during model development.

6. **High-cardinality target encoding with K-fold smoothing** beats one-hot or label encoding. Use mean + std + count summaries.

7. **Quantile spread (q90 − q50) as a stacker feature** encodes uncertainty without separate uncertainty modeling — a cheap and effective trick.

### 9.2 Process learnings

1. **Diagnose CV-LB gaps before further tuning**. The 0.57 OOF/Public gap was a stronger signal than chasing 0.05 OOF improvements. Group-leakage diagnosis took 30 minutes and revealed ~1.9 MAE of optimism.

2. **Diminishing returns are real**. After ~36.5 OOF, every new technique gave ≤0.05. The right move was to question whether more techniques were worth it vs investigating fundamentals.

3. **Per-tier modeling is conceptually attractive but practically fragile**. The oracle MAE of 28 was a tantalizing North Star but unreachable because tier classification at the boundaries is too noisy.

4. **The dataset's ceiling is set by available features, not modeling sophistication.** Without listing-level lat/lon or image features, ~35.5 OOF (random KFold) appears to be a floor. The original Kaggle baseline at 75+ MAE was a 50% improvement away — but the last 10% was 5× more expensive than the first 90%.

---

## 10. Final Numbers

| Metric | Value |
|---|---|
| Mean-value baseline (Kaggle starter) | ~85 MAE (estimated) |
| Linear regression baseline | ~52 MAE (estimated) |
| **V3 ensemble (LGB+XGB+CB, untuned)** | 36.83 |
| **V5 + geo + Optuna + 4-model stack** | 36.80 |
| **+ TF-IDF + Huber variants + 18-model stack** | 36.21 |
| **+ Unconstrained Ridge stacker + MoE + tier probs** | 35.85 |
| **+ Round 1 calibration + Round 2 quantile spread** | 35.77 |
| **+ Round 3 residual correction + weighted bases** | 35.60 |
| **+ Round 4 quantile blend + HuberRegressor stacker** | 35.57 |
| **Honest leakage-free OOF (full GroupKFold retrain)** | 37.49 |
| **Best Kaggle Public LB** | **36.18291** |

**Files for grading:**
- `best_submission_36.18.csv` — the submission that scored 36.18291 on the public leaderboard
- `airbnb_pipeline.py` → `final_stack.py` — the random-KFold training/stacking pipeline
- `gkf_retrain.py` → `gkf_final_stack.py` — the GroupKFold leakage-free version
- All scripts and intermediate OOF `.npz` files preserved in `~/Desktop/DSC148/`
