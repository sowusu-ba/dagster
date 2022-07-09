from setuptools import find_packages, setup

setup(
    name="hacker_news",
    version="0+dev",
    author="Elementl",
    author_email="hello@elementl.com",
    classifiers=[
        "Operating System :: OS Independent",
    ],
    packages=find_packages(exclude=["test"]),
    package_data={"hacker_news": ["hacker_news_dbt/*"]},
    install_requires=[
        "aiobotocore==1.3.3",
        "dagster",
        "dagster-aws",
        "dagster-dbt",
        "dagster-pandas",
        "dagster-pyspark",
        "dagster-slack",
        "dagster-postgres",
        "dagstermill",
        "dbt-core",
        "dbt-snowflake",
        "mock",
        # DataFrames were not written to Snowflake, causing errors
        "pandas<1.4.0",
        "pyarrow>=4.0.0",
        "pyspark",
        "requests",
        "fsspec",
        "s3fs",
        "scipy",
        "sklearn",
        "snowflake-sqlalchemy",
        "matplotlib",
    ],
    extras_require={"tests": ["mypy", "pylint", "pytest"]},
    python_requires=">=3.7,<=3.10",
)
