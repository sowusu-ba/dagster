from datetime import datetime

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from dagster_airflow import DagsterCloudOperator

with DAG(
    dag_id='dagster_cloud',
    start_date=datetime(2022, 5, 28),
    schedule_interval='*/5 * * * *',
    catchup=False,
) as dag:

    start_task = EmptyOperator(
        task_id='start'
    )

    print_hello_world = BashOperator(
        task_id='print_hello_world',
        bash_command='echo "HelloWorld!"'
    )

    run_dagster = DagsterCloudOperator(
        task_id='run_dagster',
        organization_id="jvd-serverless-keep",
        repostitory_location_name="example_location",
        repository_name="my_dagster_project",
        job_name="all_assets_job"
    )

    end_task = EmptyOperator(
        task_id='end'
    )

start_task >> print_hello_world
start_task >> run_dagster
run_dagster >> end_task
print_hello_world >> end_task
