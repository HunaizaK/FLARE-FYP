"""ThresholdingModel class + pickle loader for files saved from Colab."""

import pickle
import numpy as np
from scipy import ndimage


class ThresholdingModel:
    def __init__(self, min_ratios=None, beta_hi=0.3, beta_lo=3.0,
                 expansion_per_cumec=0.05):
        self.min_ratios = min_ratios or [0.1, 0.3, 0.5, 1.0, 2.0, 5.0, 10.0, 15.0, 20.0]
        self.beta_hi = beta_hi
        self.beta_lo = beta_lo
        self.expansion_per_cumec = expansion_per_cumec
        self.thresh_hi = None
        self.thresh_lo = None
        self.max_train_Q = None
        self.severe_mask = None
        self.shape = None
        self.transform = None
        self.crs = None
        self.chosen_min_ratio_hi = None
        self.chosen_min_ratio_lo = None

    def predict(self, discharge):
        if self.thresh_hi is None:
            raise RuntimeError("Model not trained")
        if discharge > self.max_train_Q:
            extra = int(np.ceil((discharge - self.max_train_Q) * self.expansion_per_cumec))
            if extra > 0:
                expanded = ndimage.binary_dilation(self.severe_mask, iterations=extra)
                out = np.zeros(self.shape, dtype=np.uint8)
                out[expanded] = 1
                out[self.severe_mask] = 2
                return out
        hi_wet = discharge >= self.thresh_hi
        lo_wet = discharge >= self.thresh_lo
        out = np.zeros(self.shape, dtype=np.uint8)
        out[lo_wet] = 1
        out[hi_wet] = 2
        return out


class _ColabUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == "ThresholdingModel":
            return ThresholdingModel
        return super().find_class(module, name)


def load_pickle(path):
    with open(path, "rb") as f:
        return _ColabUnpickler(f).load()