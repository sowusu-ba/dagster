from setuptools import find_packages, setup

setup(
    name="nyt_feed",
    version="0+dev",
    author_email="hello@elementl.com",
    packages=find_packages(exclude=["test"]),
    install_requires=[
        "dagster",
        "pandas",
    ],
    python_requires=">=3.6,<=3.10",
    include_package_data=True,
    author="Elementl",
    license="Apache-2.0",
    description="Dagster example for an ETL pipeline that pulls down metadata about New York Times articles, writes them to a CSV, and reports them in Slack.",
    url="https://github.com/dagster-io/dagster/tree/master/examples/nyt-feed",
    classifiers=[
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
    ],
)
