from abc import ABC, abstractmethod
from typing import Dict, Optional

from dagster._core.instance import MayHaveInstanceWeakref


class SecretsLoader(ABC, MayHaveInstanceWeakref):
    @abstractmethod
    def load_secrets(self, location_name: Optional[str]) -> Dict[str, str]:
        pass
