import abc
import onnxruntime as ort

class BaseExplainer():
    __metaclass__ = abc.ABCMeta
    def __init__(self, model, class_names=None):
        self.model = model
        self.class_names = class_names
        if isinstance(self.model, ort.InferenceSession):
            self.input_names = [in_param.name for in_param in self.model.get_inputs()]

    @abc.abstractmethod
    def preprocess(self, instance):
        """preprocess method to be implemented by subclasses"""
        return

    @abc.abstractmethod
    def explain(self, instance):
        """explain method to be implemented by subclasses"""
        return

    @abc.abstractmethod
    def predict_proba(self, instances):
        """explain method to be implemented by subclasses"""
        return

