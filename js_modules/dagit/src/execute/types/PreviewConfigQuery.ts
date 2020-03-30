// @generated
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { ExecutionSelector, EvaluationErrorReason } from "./../../types/globalTypes";

// ====================================================
// GraphQL query operation: PreviewConfigQuery
// ====================================================

export interface PreviewConfigQuery_isPipelineConfigValid_InvalidSubsetError {
  __typename: "InvalidSubsetError" | "PipelineConfigValidationValid" | "PipelineNotFoundError" | "PythonError";
}

export interface PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack_entries_EvaluationStackPathEntry {
  __typename: "EvaluationStackPathEntry";
  fieldName: string;
}

export interface PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack_entries_EvaluationStackListItemEntry {
  __typename: "EvaluationStackListItemEntry";
  listIndex: number;
}

export type PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack_entries = PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack_entries_EvaluationStackPathEntry | PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack_entries_EvaluationStackListItemEntry;

export interface PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack {
  __typename: "EvaluationStack";
  entries: PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack_entries[];
}

export interface PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors {
  __typename: "FieldNotDefinedConfigError" | "FieldsNotDefinedConfigError" | "MissingFieldConfigError" | "MissingFieldsConfigError" | "RuntimeMismatchConfigError" | "SelectorTypeConfigError";
  reason: EvaluationErrorReason;
  message: string;
  stack: PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors_stack;
}

export interface PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid {
  __typename: "PipelineConfigValidationInvalid";
  errors: PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid_errors[];
}

export type PreviewConfigQuery_isPipelineConfigValid = PreviewConfigQuery_isPipelineConfigValid_InvalidSubsetError | PreviewConfigQuery_isPipelineConfigValid_PipelineConfigValidationInvalid;

export interface PreviewConfigQuery_executionPlan_ExecutionPlan {
  __typename: "ExecutionPlan" | "PipelineConfigValidationInvalid";
}

export interface PreviewConfigQuery_executionPlan_PipelineNotFoundError {
  __typename: "PipelineNotFoundError";
  message: string;
}

export interface PreviewConfigQuery_executionPlan_InvalidSubsetError {
  __typename: "InvalidSubsetError";
  message: string;
}

export interface PreviewConfigQuery_executionPlan_PythonError_cause {
  __typename: "PythonError";
  message: string;
  stack: string[];
}

export interface PreviewConfigQuery_executionPlan_PythonError {
  __typename: "PythonError";
  message: string;
  stack: string[];
  cause: PreviewConfigQuery_executionPlan_PythonError_cause | null;
}

export type PreviewConfigQuery_executionPlan = PreviewConfigQuery_executionPlan_ExecutionPlan | PreviewConfigQuery_executionPlan_PipelineNotFoundError | PreviewConfigQuery_executionPlan_InvalidSubsetError | PreviewConfigQuery_executionPlan_PythonError;

export interface PreviewConfigQuery {
  isPipelineConfigValid: PreviewConfigQuery_isPipelineConfigValid;
  executionPlan: PreviewConfigQuery_executionPlan;
}

export interface PreviewConfigQueryVariables {
  pipeline: ExecutionSelector;
  environmentConfigData: any;
  mode: string;
}
