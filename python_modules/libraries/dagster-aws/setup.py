from typing import Dict

from setuptools import find_packages, setup


def get_version() -> str:
    version: Dict[str, str] = {}
    with open("dagster_aws/version.py", encoding="utf8") as fp:
        exec(fp.read(), version)  # pylint: disable=W0122

    return version["__version__"]


if __name__ == "__main__":
    ver = get_version()
    # dont pin dev installs to avoid pip dep resolver issues
    pin = "" if ver == "0+dev" else f"=={ver}"
    setup(
        name="dagster-aws",
        version=ver,
        author="Elementl",
        author_email="hello@elementl.com",
        license="Apache-2.0",
        description="Package for AWS-specific Dagster framework solid and resource components.",
        url="https://github.com/dagster-io/dagster/tree/master/python_modules/libraries/dagster-aws",
        classifiers=[
            "License :: OSI Approved :: Apache Software License",
            "Operating System :: OS Independent",
        ],
        packages=find_packages(exclude=["dagster_aws_tests*"]),
        include_package_data=True,
        install_requires=[
            "boto3",
            f"dagster{pin}",
            "packaging",
            "requests",
        ],
        extras_require={
            "redshift": ["psycopg2-binary"],
            "pyspark": ["dagster-pyspark"],
            "test": [
                "moto>=2.2.8",
                "requests-mock",
                "xmltodict==0.12.0",  # pinned until moto>=3.1.9 (https://github.com/spulec/moto/issues/5112)
            ],
            python_requires=">=3.6,<=3.10",
        },
        zip_safe=False,
    )
