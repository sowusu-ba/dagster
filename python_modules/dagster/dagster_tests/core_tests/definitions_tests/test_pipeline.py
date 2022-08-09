import pytest

from dagster import (
    DagsterInvalidDefinitionError,
    DependencyDefinition,
    In,
    Int,
    Out,
    Output,
    op,
    usable_as_dagster_type,
)
from dagster._legacy import PipelineDefinition, composite_solid, execute_pipeline, pipeline


def builder(graph):
    return graph.add_one(graph.return_one())


@op
def return_one():
    return 1


@op
def return_two():
    return 2


@op
def return_three():
    return 3


@op(ins={"num": In()})
def add_one(num):
    return num + 1


def test_basic_use_case():
    pipeline_def = PipelineDefinition(
        name="basic",
        solid_defs=[return_one, add_one],
        dependencies={"add_one": {"num": DependencyDefinition("return_one")}},
    )

    assert execute_pipeline(pipeline_def).result_for_solid("add_one").output_value() == 2


def test_basic_use_case_with_dsl():
    @pipeline
    def test():
        add_one(num=return_one())

    assert execute_pipeline(test).result_for_solid("add_one").output_value() == 2


def test_two_inputs_without_dsl():
    @op(ins={"num_one": In(), "num_two": In()})
    def subtract(num_one, num_two):
        return num_one - num_two

    pipeline_def = PipelineDefinition(
        solid_defs=[subtract, return_two, return_three],
        name="test",
        dependencies={
            "subtract": {
                "num_one": DependencyDefinition("return_two"),
                "num_two": DependencyDefinition("return_three"),
            }
        },
    )

    assert execute_pipeline(pipeline_def).result_for_solid("subtract").output_value() == -1


def test_two_inputs_with_dsl():
    @op(ins={"num_one": In(), "num_two": In()})
    def subtract(num_one, num_two):
        return num_one - num_two

    @pipeline
    def test():
        subtract(num_one=return_two(), num_two=return_three())

    assert execute_pipeline(test).result_for_solid("subtract").output_value() == -1


def test_basic_aliasing_with_dsl():
    @pipeline
    def test():
        add_one.alias("renamed")(num=return_one())

    assert execute_pipeline(test).result_for_solid("renamed").output_value() == 2


def test_diamond_graph():
    @op(out={"value_one": Out(), "value_two": Out()})
    def emit_values(_context):
        yield Output(1, "value_one")
        yield Output(2, "value_two")

    @op(ins={"num_one": In(), "num_two": In()})
    def subtract(num_one, num_two):
        return num_one - num_two

    @pipeline
    def diamond_pipeline():
        value_one, value_two = emit_values()
        subtract(
            num_one=add_one(num=value_one),
            num_two=add_one.alias("renamed")(num=value_two),
        )

    result = execute_pipeline(diamond_pipeline)

    assert result.result_for_solid("subtract").output_value() == -1


def test_two_cliques():
    @pipeline
    def diamond_pipeline():
        return_one()
        return_two()

    result = execute_pipeline(diamond_pipeline)

    assert result.result_for_solid("return_one").output_value() == 1
    assert result.result_for_solid("return_two").output_value() == 2


def test_deep_graph():
    @op(config_schema=Int)
    def download_num(context):
        return context.op_config

    @op(ins={"num": In()})
    def unzip_num(num):
        return num

    @op(ins={"num": In()})
    def ingest_num(num):
        return num

    @op(ins={"num": In()})
    def subsample_num(num):
        return num

    @op(ins={"num": In()})
    def canonicalize_num(num):
        return num

    @op(ins={"num": In()})
    def load_num(num):
        return num + 3

    @pipeline
    def test():
        load_num(
            num=canonicalize_num(
                num=subsample_num(num=ingest_num(num=unzip_num(num=download_num())))
            )
        )

    result = execute_pipeline(test, {"solids": {"download_num": {"config": 123}}})
    assert result.result_for_solid("canonicalize_num").output_value() == 123
    assert result.result_for_solid("load_num").output_value() == 126


def test_unconfigurable_inputs_pipeline():
    @usable_as_dagster_type
    class NewType:
        pass

    @op(ins={"_x": In(NewType)})
    def noop(_x):
        pass

    with pytest.raises(
        DagsterInvalidDefinitionError,
        match="Input '_x' of op 'noop' has no way of being resolved. Must "
        "provide a resolution to this input via another op/graph, or via a "
        "direct input value mapped from the top-level graph.",
    ):

        @pipeline
        def _bad_inputs():
            noop()


def test_dupe_defs_fail():
    @op(name="same")
    def noop():
        pass

    @op(name="same")
    def noop2():
        pass

    with pytest.raises(DagsterInvalidDefinitionError):

        @pipeline
        def _dupes():
            noop()
            noop2()

    with pytest.raises(DagsterInvalidDefinitionError):
        PipelineDefinition(name="dupes", solid_defs=[noop, noop2])


def test_composite_dupe_defs_fail():
    @op
    def noop():
        pass

    @composite_solid(name="same")
    def composite_noop():
        noop()
        noop()
        noop()

    @composite_solid(name="same")
    def composite_noop2():
        noop()

    @composite_solid
    def wrapper():
        composite_noop2()

    @composite_solid
    def top():
        wrapper()
        composite_noop()

    with pytest.raises(DagsterInvalidDefinitionError):

        @pipeline
        def _dupes():
            composite_noop()
            composite_noop2()

    with pytest.raises(DagsterInvalidDefinitionError):
        PipelineDefinition(name="dupes", solid_defs=[top])


def test_two_inputs_with_reversed_input_defs_and_dsl():
    @op(ins={"num_two": In(), "num_one": In()})
    def subtract_ctx(_context, num_one, num_two):
        return num_one - num_two

    @op(ins={"num_two": In(), "num_one": In()})
    def subtract(num_one, num_two):
        return num_one - num_two

    @pipeline
    def test():
        two = return_two()
        three = return_three()
        subtract(two, three)
        subtract_ctx(two, three)

    assert execute_pipeline(test).result_for_solid("subtract").output_value() == -1
    assert execute_pipeline(test).result_for_solid("subtract_ctx").output_value() == -1


def test_single_non_positional_input_use():
    @op(ins={"num": In()})
    def add_one_kw(**kwargs):
        return kwargs["num"] + 1

    @pipeline
    def test():
        # the decorated solid fn doesn't define args
        # but since there is only one it is unambiguous
        add_one_kw(return_two())

    assert execute_pipeline(test).result_for_solid("add_one_kw").output_value() == 3


def test_single_positional_single_kwarg_input_use():
    @op(ins={"num_two": In(), "num_one": In()})
    def subtract_kw(num_one, **kwargs):
        return num_one - kwargs["num_two"]

    @pipeline
    def test():
        # the decorated solid fn only defines one positional arg
        # and one kwarg so passing two by position is unambiguous
        # since the second argument must be the one kwarg
        subtract_kw(return_two(), return_three())

    assert execute_pipeline(test).result_for_solid("subtract_kw").output_value() == -1


def test_bad_positional_input_use():
    @op(ins={"num_two": In(), "num_one": In(), "num_three": In()})
    def add_kw(num_one, **kwargs):
        return num_one + kwargs["num_two"] + kwargs["num_three"]

    with pytest.raises(DagsterInvalidDefinitionError, match="Use keyword args instead"):

        @pipeline
        def _fail():
            # the decorated solid fn only defines one positional arg
            # so the two remaining have no positions and this is
            # ambiguous
            add_kw(return_two(), return_two(), return_two())
