import os
from typing import Dict, List, Optional, Tuple

from dagster._config import StringSource
from dagster._core.utils import parse_env_var
from dagster._serdes import ConfigurableClass
from dagster._utils import merge_dicts

from .loader import SecretsLoader


class EnvFileSecretsLoader(SecretsLoader, ConfigurableClass):
    def __init__(
        self,
        inst_data=None,
        base_dir=None,
    ):
        self._inst_data = inst_data
        self._base_dir = base_dir

    def _get_secrets(self, file_path) -> Dict[str, str]:
        secret_tuples: List[Tuple[str, str]] = []
        with open(file_path, "r", encoding="utf8") as file:
            lines = file.readlines()
            for line in lines:
                if not "=" in line:
                    raise Exception("Invalid line in secrets file - missing '=' character")
                secret_tuples.append(parse_env_var(line))

        return dict(secret_tuples)

    def load_secrets(self, location_name: Optional[str]) -> Dict[str, str]:
        secrets: Dict[str, str] = {}

        env_file_path = os.path.join(self._base_dir, ".env")

        if os.path.exists(env_file_path):
            secrets = self._get_secrets(env_file_path)

        if location_name:
            location_file_path = os.path.join(self._base_dir, f".env.{location_name}")
            if os.path.exists(location_file_path):
                secrets = merge_dicts(secrets, self._get_secrets(location_file_path))

        return secrets

    @property
    def inst_data(self):
        return self._inst_data

    @classmethod
    def config_type(cls):
        return {"base_dir": StringSource}

    @staticmethod
    def from_config_value(inst_data, config_value):
        return EnvFileSecretsLoader(inst_data=inst_data, **config_value)
