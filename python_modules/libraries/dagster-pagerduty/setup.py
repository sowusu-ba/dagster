from typing import Dict

from setuptools import find_packages, setup


def get_version() -> str:
    version: Dict[str, str] = {}
    with open("dagster_pagerduty/version.py", encoding="utf8") as fp:
        exec(fp.read(), version)  # pylint: disable=W0122

    return version["__version__"]


if __name__ == "__main__":
    ver = get_version()
    # dont pin dev installs to avoid pip dep resolver issues
    pin = "" if ver == "0+dev" else f"=={ver}"
    setup(
        name="dagster-pagerduty",
        version=ver,
        author="Elementl",
        author_email="hello@elementl.com",
        license="Apache-2.0",
        description="Package for pagerduty Dagster framework components.",
        url="https://github.com/dagster-io/dagster/tree/master/python_modules/libraries/dagster-pagerduty",
        classifiers=[
            "License :: OSI Approved :: Apache Software License",
            "Operating System :: OS Independent",
        ],
        packages=find_packages(exclude=["dagster_pagerduty_tests*"]),
        install_requires=[f"dagster{pin}", "pypd"],
        python_requires=">=3.6,<=3.10",
        zip_safe=False,
    )
