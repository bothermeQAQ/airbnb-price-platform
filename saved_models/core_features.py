"""Inference-ready core feature pipeline for the NYC Airbnb price model.

Faithfully ports the feature engineering of `airbnb_pipeline.build_features` +
`airbnb_pipeline_v5.{add_lat_lon_features, target_encode_stats_kfold}` that
produced `data_v5.pkl` (the 183-numeric-feature "geo only" matrix the 36.18
ensemble's base models were trained on).

Difference vs the original one-shot scripts: target encoding here uses the
full-train smoothed map (the same map the original applied to the *test* set),
so `CoreFeatureBuilder` can transform a single new listing. All fitted state
(zip->lat/lon, KMeans, TE maps, density counts, category codes) is stored on
the instance so it pickles into `preprocessor.pkl`.
"""
import re
import warnings
import numpy as np
import pandas as pd

# Adding ~140 engineered columns one at a time triggers a cosmetic fragmentation
# warning; irrelevant for a 1-row inference frame.
warnings.filterwarnings('ignore', category=pd.errors.PerformanceWarning)

RNG = 42

# --- NYC landmarks (lat, lon) — from airbnb_pipeline_v5.LANDMARKS ---
LANDMARKS = {
    'times_sq': (40.7580, -73.9855),
    'wall_st': (40.7074, -74.0113),
    'central_park': (40.7829, -73.9654),
    'jfk': (40.6413, -73.7781),
    'lga': (40.7769, -73.8740),
    'brooklyn_br': (40.7061, -73.9969),
    'empire': (40.7484, -73.9857),
    'union_sq': (40.7359, -73.9911),
    'williamsburg': (40.7081, -73.9571),
    'soho': (40.7233, -74.0030),
}
MANHATTAN = (40.7831, -73.9712)
NYC_CENTER = (40.7128, -74.0060)

AMENITY_KEYWORDS = [
    'wifi', 'internet', 'tv', 'cable tv', 'air conditioning', 'heating', 'kitchen', 'washer', 'dryer',
    'dishwasher', 'free parking', 'parking', 'pool', 'gym', 'elevator', 'doorman', 'hot tub',
    'pets allowed', 'smoking allowed', 'family/kid friendly', 'wheelchair accessible',
    'breakfast', 'fireplace', 'laptop friendly workspace', 'self check-in', 'lockbox', '24-hour check-in',
    'private entrance', 'shampoo', 'hair dryer', 'iron', 'hangers', 'essentials',
    'balcony', 'patio', 'garden', 'beachfront', 'waterfront',
    'free street parking', 'paid parking', 'host greets you', 'long term stays allowed',
    'crib', 'high chair', 'bathtub', 'safe', 'pool', 'private bathroom',
    'cable tv', 'netflix', 'smart lock', 'keypad', 'gym', 'first aid kit',
    'smoke detector', 'carbon monoxide detector', 'fire extinguisher',
    'building staff', 'concierge', 'luggage dropoff allowed',
]

_AMEN_RE = re.compile(r'"([^"]+)"|([^,{}]+)')

BOOL_COLS = ['host_is_superhost', 'host_has_profile_pic', 'host_identity_verified',
             'instant_bookable', 'is_business_travel_ready',
             'require_guest_profile_picture', 'require_guest_phone_verification']

TEXT_COLS = ['name', 'summary', 'space', 'description', 'neighborhood_overview', 'notes',
             'transit', 'access', 'interaction', 'house_rules', 'host_about']

NAME_KEYWORDS = ['luxury', 'cozy', 'studio', 'apartment', 'loft', 'spacious', 'modern',
                 'private', 'shared', 'central', 'manhattan', 'brooklyn', 'queens', 'bronx',
                 'penthouse', 'view', 'park']

# low-cardinality categoricals (from airbnb_pipeline.build_features)
CAT_COLS = ['property_type', 'room_type', 'bed_type', 'cancellation_policy',
            'host_response_time', 'neighbourhood_cleansed', 'neighbourhood_group_cleansed',
            'zipcode', 'host_neighbourhood', 'city', 'state', 'market', 'country_code', 'country']

# OOF target-encoded columns (mean+std), from airbnb_pipeline_v5.prepare_datasets
TE_COLS = ['neighbourhood_cleansed', 'zipcode', 'host_neighbourhood',
           'property_type', 'neighbourhood_group_cleansed', 'city',
           'geo_cluster_10', 'geo_cluster_25', 'geo_cluster_50']

DENSITY_COLS = ['neighbourhood_cleansed', 'zipcode', 'geo_cluster_25', 'geo_cluster_50']

DROP_TEXT = ['name', 'summary', 'space', 'description', 'neighborhood_overview', 'notes',
             'transit', 'access', 'interaction', 'house_rules', 'host_about',
             'amenities', 'host_verifications', 'host_name', 'host_location',
             'host_since', 'first_review', 'last_review',
             'experiences_offered', 'country', 'country_code', 'state',
             'host_id', 'id']

REF_DATE = pd.Timestamp('2019-08-01')


# ----------------------- scalar parsers -----------------------
def parse_money(s):
    if pd.isna(s):
        return np.nan
    s = str(s).replace('$', '').replace(',', '').strip()
    try:
        return float(s)
    except Exception:
        return np.nan


def parse_pct(s):
    if pd.isna(s):
        return np.nan
    s = str(s).replace('%', '').strip()
    try:
        return float(s)
    except Exception:
        return np.nan


def parse_bool(s):
    if pd.isna(s):
        return np.nan
    if isinstance(s, (int, float)) and not isinstance(s, bool):
        return float(s)
    s = str(s).strip().lower()
    if s in ('t', 'true', '1', 'yes'):
        return 1.0
    if s in ('f', 'false', '0', 'no'):
        return 0.0
    return np.nan


def parse_amenities_list(s):
    if pd.isna(s):
        return []
    s = str(s).strip()
    if s.startswith('{'):
        s = s[1:]
    if s.endswith('}'):
        s = s[:-1]
    items = []
    for m in _AMEN_RE.finditer(s):
        v = (m.group(1) or m.group(2) or '').strip().lower()
        if v and v != 'translation missing: en.hosting_amenity_49' and v != 'translation missing: en.hosting_amenity_50':
            items.append(v)
    return items


def text_len(s):
    return 0 if pd.isna(s) else len(str(s))


def text_words(s):
    return 0 if pd.isna(s) else len(str(s).split())


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1r, lat2r = np.radians(lat1), np.radians(lat2)
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1r) * np.cos(lat2r) * np.sin(dlon / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(np.clip(a, 0, 1)))


def _amen_col(kw):
    return 'am_' + re.sub(r'[^a-z0-9]+', '_', kw).strip('_')


def build_raw_features(df):
    """Row-wise feature engineering (port of airbnb_pipeline.build_features).
    No cross-row fitting — safe for a single new listing."""
    df = df.copy()

    df['extra_people'] = df['extra_people'].apply(parse_money)
    df['host_response_rate'] = df['host_response_rate'].apply(parse_pct)
    df['host_acceptance_rate'] = df['host_acceptance_rate'].apply(parse_pct)

    for c in BOOL_COLS:
        df[c] = df[c].apply(parse_bool)

    df['host_tenure_days'] = (REF_DATE - pd.to_datetime(df['host_since'], errors='coerce')).dt.days
    df['days_since_first_review'] = (REF_DATE - pd.to_datetime(df['first_review'], errors='coerce')).dt.days
    df['days_since_last_review'] = (REF_DATE - pd.to_datetime(df['last_review'], errors='coerce')).dt.days
    df['has_first_review'] = df['first_review'].notna().astype(int)
    df['has_last_review'] = df['last_review'].notna().astype(int)

    am_lists = df['amenities'].apply(parse_amenities_list)
    am_sets = am_lists.apply(set)
    df['amenities_len'] = df['amenities'].fillna('').astype(str).str.len()
    df['amenities_count'] = am_lists.apply(len)
    for kw in AMENITY_KEYWORDS:
        df[_amen_col(kw)] = am_sets.apply(lambda s, k=kw: int(k in s))

    df['host_verifications_count'] = df['host_verifications'].fillna('').apply(
        lambda s: len(re.findall(r"'[^']+'", s)) if isinstance(s, str) else 0)

    for c in TEXT_COLS:
        df[c + '_len'] = df[c].apply(text_len)
    df['name_words'] = df['name'].apply(text_words)
    df['description_words'] = df['description'].apply(text_words)

    name_lower = df['name'].fillna('').astype(str).str.lower()
    for kw in NAME_KEYWORDS:
        df['name_has_' + kw] = name_lower.str.contains(kw, regex=False).astype(int)

    for c in ['bathrooms', 'bedrooms', 'beds', 'square_feet']:
        df[c] = pd.to_numeric(df[c], errors='coerce')

    df['beds_per_person'] = df['beds'] / df['accommodates'].replace(0, np.nan)
    df['bath_per_person'] = df['bathrooms'] / df['accommodates'].replace(0, np.nan)
    df['bedroom_per_person'] = df['bedrooms'] / df['accommodates'].replace(0, np.nan)
    df['beds_per_bedroom'] = df['beds'] / df['bedrooms'].replace(0, np.nan)
    df['accom_minus_beds'] = df['accommodates'] - df['beds']
    df['extra_guests'] = (df['accommodates'] - df['guests_included']).clip(lower=0)
    df['extra_people_x_extra_guests'] = df['extra_people'] * df['extra_guests']

    df['reviews_per_tenure'] = df['number_of_reviews'] / df['host_tenure_days'].replace(0, np.nan)
    df['avg_review_score'] = df[['review_scores_rating', 'review_scores_accuracy',
                                 'review_scores_cleanliness', 'review_scores_checkin',
                                 'review_scores_communication', 'review_scores_location',
                                 'review_scores_value']].mean(axis=1)

    df['zipcode'] = df['zipcode'].astype(str).str.extract(r'(\d{5})', expand=False)

    for c in CAT_COLS:
        df[c] = df[c].astype(str).where(df[c].notna(), 'NA')

    return df


class CoreFeatureBuilder:
    """Fit on raw train+test; transform any raw listing(s) into the model matrix."""

    def __init__(self):
        self.fitted = False

    # ---------------- fit ----------------
    def fit(self, train_raw, test_raw):
        import pgeocode
        from sklearn.cluster import KMeans

        self.raw_input_cols = [c for c in test_raw.columns]  # 64 raw columns
        n_train = len(train_raw)

        full = build_raw_features(pd.concat([train_raw, test_raw], axis=0,
                                            ignore_index=True, sort=False))

        # --- zip -> lat/lon via pgeocode ---
        nomi = pgeocode.Nominatim('us')
        uniq = full['zipcode'].dropna().astype(str).unique().tolist()
        zdf = nomi.query_postal_code(uniq)
        self.zip_to_lat = {str(k): v for k, v in zip(zdf['postal_code'], zdf['latitude'])}
        self.zip_to_lon = {str(k): v for k, v in zip(zdf['postal_code'], zdf['longitude'])}

        full = self._add_geo_raw(full)

        # KMeans geo clusters (fit on full lat/lon)
        coords = full[['latitude', 'longitude']].values
        self.kmeans = {}
        for k in [10, 25, 50]:
            km = KMeans(n_clusters=k, random_state=RNG, n_init=10).fit(coords)
            self.kmeans[k] = km
            full['geo_cluster_%d' % k] = km.predict(coords).astype(int)

        full['dist_manhattan'] = haversine(full['latitude'].values, full['longitude'].values,
                                           MANHATTAN[0], MANHATTAN[1])

        # --- target-encoding maps (full-train smoothed mean/std on log1p price) ---
        target = np.log1p(train_raw['price'].astype(float).values)
        tr = full.iloc[:n_train].copy()
        tr['__target__'] = target
        self.te = {}
        smoothing = 20.0
        for c in TE_COLS:
            gmean = tr['__target__'].mean()
            gstd = tr['__target__'].std()
            key = tr[c].astype(str)
            agg = tr.assign(__k__=key).groupby('__k__')['__target__'].agg(['mean', 'std', 'count'])
            sm_mean = (agg['mean'] * agg['count'] + gmean * smoothing) / (agg['count'] + smoothing)
            sm_std = agg['std'].fillna(gstd)
            self.te[c] = {'mean': sm_mean.to_dict(), 'std': sm_std.to_dict(),
                          'gmean': gmean, 'gstd': gstd}

        # --- density counts (train+test) ---
        self.density = {}
        for c in DENSITY_COLS:
            cnt = full[c].astype(str).value_counts()
            self.density[c] = cnt.to_dict()

        # --- categorical code maps (train+test order of appearance) ---
        cat_in = [c for c in CAT_COLS if c not in DROP_TEXT]
        cat_in += ['geo_cluster_10', 'geo_cluster_25', 'geo_cluster_50']
        self.cat_in_features = cat_in
        self.cat_code_maps = {}
        self.cat_na_code = {}
        for c in cat_in:
            vals = pd.Index(full[c].astype(str)).unique()
            mp = {v: i for i, v in enumerate(vals)}
            self.cat_code_maps[c] = mp
            self.cat_na_code[c] = mp.get('NA', 0)

        # --- assemble the full feature frame to lock column order ---
        feat = self._assemble(full)
        self.feature_cols = list(feat.columns)
        self.fitted = True
        return self

    # ------------- geometry helpers -------------
    def _add_geo_raw(self, df):
        df = df.copy()
        z = df['zipcode'].astype(str)
        df['latitude'] = z.map(self.zip_to_lat).astype(float)
        df['longitude'] = z.map(self.zip_to_lon).astype(float)
        df['latitude'] = df['latitude'].fillna(NYC_CENTER[0])
        df['longitude'] = df['longitude'].fillna(NYC_CENTER[1])
        for name, (la, lo) in LANDMARKS.items():
            df['dist_' + name] = haversine(df['latitude'].values, df['longitude'].values, la, lo)
        # dist_centroid uses the fit-time full-data median as the reference point
        if not hasattr(self, 'centroid'):
            self.centroid = (float(df['latitude'].median()), float(df['longitude'].median()))
        df['dist_centroid'] = haversine(df['latitude'].values, df['longitude'].values,
                                        self.centroid[0], self.centroid[1])
        return df

    def _assemble(self, full):
        """Take a build_raw_features+geo frame, add TE/density, drop text, return feature frame
        (categoricals still as strings; geo clusters as ints)."""
        df = full.copy()
        for c in TE_COLS:
            t = self.te[c]
            key = df[c].astype(str)
            df[c + '_te_mean'] = key.map(t['mean']).fillna(t['gmean']).values
            df[c + '_te_std'] = key.map(t['std']).fillna(t['gstd']).values
        for c in DENSITY_COLS:
            df[c + '_count'] = df[c].astype(str).map(self.density[c]).fillna(0).values
        feat = df.drop(columns=[c for c in DROP_TEXT if c in df.columns])
        if '__target__' in feat.columns:
            feat = feat.drop(columns='__target__')
        if 'price' in feat.columns:
            feat = feat.drop(columns='price')
        return feat

    # ---------------- transform ----------------
    def _prep(self, raw_df):
        """raw -> assembled feature frame (string cats), columns reindexed to feature_cols."""
        df = raw_df.copy()
        for c in self.raw_input_cols:
            if c not in df.columns:
                df[c] = np.nan
        df = build_raw_features(df)
        df = self._add_geo_raw(df)
        coords = df[['latitude', 'longitude']].values
        for k in [10, 25, 50]:
            df['geo_cluster_%d' % k] = self.kmeans[k].predict(coords).astype(int)
        df['dist_manhattan'] = haversine(df['latitude'].values, df['longitude'].values,
                                         MANHATTAN[0], MANHATTAN[1])
        feat = self._assemble(df)
        for c in self.feature_cols:
            if c not in feat.columns:
                feat[c] = np.nan
        return feat[self.feature_cols]

    def transform_cb(self, raw_df):
        """CatBoost matrix: categoricals as 'NA'-filled strings."""
        feat = self._prep(raw_df)
        out = feat.copy()
        for c in self.cat_in_features:
            out[c] = out[c].astype(str).fillna('NA')
        num_cols = [c for c in self.feature_cols if c not in self.cat_in_features]
        out[num_cols] = out[num_cols].apply(pd.to_numeric, errors='coerce')
        return out

    def transform_num(self, raw_df):
        """LGB/XGB matrix: categoricals integer-coded (unseen -> 'NA' code)."""
        feat = self._prep(raw_df)
        out = feat.copy()
        for c in self.cat_in_features:
            mp = self.cat_code_maps[c]
            na = self.cat_na_code[c]
            out[c] = out[c].astype(str).map(lambda v, m=mp, n=na: m.get(v, n)).astype('int32')
        num_cols = [c for c in self.feature_cols if c not in self.cat_in_features]
        out[num_cols] = out[num_cols].apply(pd.to_numeric, errors='coerce')
        return out

    def transform_one(self, listing: dict):
        """Convenience: single listing dict -> (num_matrix, cb_matrix) 1-row frames."""
        df = pd.DataFrame([listing])
        return self.transform_num(df), self.transform_cb(df)
