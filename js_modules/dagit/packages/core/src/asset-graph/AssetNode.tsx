import {gql} from '@apollo/client';
import {Colors, Icon, FontFamily, Box, CaptionMono, Spinner, Tooltip} from '@dagster-io/ui';
import isEqual from 'lodash/isEqual';
import React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components/macro';

import {withMiddleTruncation} from '../app/Util';
import {NodeHighlightColors} from '../graph/OpNode';
import {OpTags} from '../graph/OpTags';
import {linkToRunEvent, titleForRun} from '../runs/RunUtils';
import {TimestampDisplay} from '../schedules/TimestampDisplay';
import {AssetComputeStatus} from '../types/globalTypes';
import {markdownToPlaintext} from '../ui/markdownToPlaintext';

import {LiveDataForNode} from './Utils';
import {ASSET_NODE_ANNOTATIONS_MAX_WIDTH, ASSET_NODE_NAME_MAX_LENGTH} from './layout';
import {AssetNodeFragment} from './types/AssetNodeFragment';

const MISSING_LIVE_DATA = {
  unstartedRunIds: [],
  inProgressRunIds: [],
  runWhichFailedToMaterialize: null,
  lastMaterialization: null,
  lastObservation: null,
  currentLogicalVersion: null,
  projectedLogicalVersion: null,
  computeStatus: AssetComputeStatus.NONE,
  stepKey: '',
};

const VERSION_COLORS = {
  sourceBackground: Colors.Gray50,
  sourceText: Colors.Gray300,
  staleBackground: Colors.Yellow50,
  okBackground: Colors.Green200,
  staleText: Colors.Yellow700,
  okText: Colors.Blue200,
};

export const AssetNode: React.FC<{
  definition: AssetNodeFragment;
  liveData?: LiveDataForNode;
  selected: boolean;
  inAssetCatalog?: boolean;
}> = React.memo(({definition, selected, liveData, inAssetCatalog}) => {
  const firstOp = definition.opNames.length ? definition.opNames[0] : null;
  const computeName = definition.graphName || definition.opNames[0] || null;

  // Used for linking to the run with this step highlighted. We only support highlighting
  // a single step, so just use the first one.
  const stepKey = firstOp || '';

  const displayName = definition.assetKey.path[definition.assetKey.path.length - 1];

  const {
    lastMaterialization,
    lastObservation,
    currentLogicalVersion,
    projectedLogicalVersion,
    computeStatus,
  } = liveData || MISSING_LIVE_DATA;

  const {isSource, isVersioned} = definition;
  const isStale = !!(
    !isSource &&
    projectedLogicalVersion &&
    currentLogicalVersion !== projectedLogicalVersion
  );

  return (
    <AssetInsetForHoverEffect>
      <AssetNodeContainer $selected={selected}>
        <AssetNodeBox $selected={selected} $isSource={isSource}>
          <Name $isSource={isSource}>
            <span style={{marginTop: 1}}>
              <Icon name={isSource ? 'source_asset' : 'asset'} />
            </span>
            <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
              {withMiddleTruncation(displayName, {
                maxLength: ASSET_NODE_NAME_MAX_LENGTH,
              })}
            </div>
            <div style={{flex: 1}} />
            {isVersioned ? (
              <VersionedBadge isSource={isSource} isStale={isStale} />
            ) : (
              <div style={{maxWidth: ASSET_NODE_ANNOTATIONS_MAX_WIDTH}}>
                <ComputeStatusNotice computeStatus={computeStatus} />
              </div>
            )}
          </Name>
          {definition.description && !inAssetCatalog && (
            <Description>{markdownToPlaintext(definition.description).split('\n')[0]}</Description>
          )}
          {computeName && displayName !== computeName && (
            <Description>
              <Box
                flex={{gap: 4, alignItems: 'flex-end'}}
                style={{marginLeft: -2, overflow: 'hidden'}}
              >
                <Icon name={definition.graphName ? 'job' : 'op'} size={16} />
                <div style={{minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                  {computeName}
                </div>
              </Box>
            </Description>
          )}

          {isSource && !isVersioned ? null : (
            <Stats>
              {isSource ? (
                lastObservation ? (
                  <StatsRow>
                    <span>Observed</span>
                    <CaptionMono style={{textAlign: 'right'}}>
                      <AssetRunLink
                        runId={lastObservation.runId}
                        event={{stepKey, timestamp: lastObservation.timestamp}}
                      >
                        <TimestampDisplay
                          timestamp={Number(lastObservation.timestamp) / 1000}
                          timeFormat={{showSeconds: false, showTimezone: false}}
                        />
                      </AssetRunLink>
                    </CaptionMono>
                  </StatsRow>
                ) : (
                  <>
                    <StatsRow>
                      <span>Observed</span>
                      <span>–</span>
                    </StatsRow>
                  </>
                )
              ) : lastMaterialization ? (
                <StatsRow>
                  <span>Materialized</span>
                  <CaptionMono style={{textAlign: 'right'}}>
                    <AssetRunLink
                      runId={lastMaterialization.runId}
                      event={{stepKey, timestamp: lastMaterialization.timestamp}}
                    >
                      <TimestampDisplay
                        timestamp={Number(lastMaterialization.timestamp) / 1000}
                        timeFormat={{showSeconds: false, showTimezone: false}}
                      />
                    </AssetRunLink>
                  </CaptionMono>
                </StatsRow>
              ) : (
                <>
                  <StatsRow>
                    <span>Materialized</span>
                    <span>–</span>
                  </StatsRow>
                </>
              )}

              {!isSource && (
                <>
                  <StatsRow>
                    <span>Latest&nbsp;Run</span>
                    <CaptionMono style={{textAlign: 'right'}}>
                      <AssetLatestRunWithNotices liveData={liveData} />
                    </CaptionMono>
                  </StatsRow>
                  {definition.opVersion && definition.opVersion !== 'DEFAULT' && (
                    <StatsRow>
                      <span>Code Version</span>
                      <CaptionMono style={{textAlign: 'right'}}>{definition.opVersion}</CaptionMono>
                    </StatsRow>
                  )}
                </>
              )}
              {isVersioned && currentLogicalVersion && (isSource || lastMaterialization) && (
                <StatsRow>
                  <span style={{color: isStale ? VERSION_COLORS.staleText : VERSION_COLORS.okText}}>
                    Logical Version
                  </span>
                  <CaptionMono style={{textAlign: 'right'}}>
                    <LogicalVersion
                      isSource={isSource}
                      isStale={isStale}
                      value={currentLogicalVersion}
                    />
                  </CaptionMono>
                </StatsRow>
              )}
              {isStale && lastMaterialization && projectedLogicalVersion && (
                <StatsRow>
                  <span style={{color: VERSION_COLORS.staleText}}>Projected Logical Version</span>
                  <CaptionMono style={{textAlign: 'right'}}>
                    <LogicalVersion
                      isSource={isSource}
                      isStale={isStale}
                      value={projectedLogicalVersion}
                    />
                  </CaptionMono>
                </StatsRow>
              )}
            </Stats>
          )}
          {definition.computeKind && (
            <OpTags
              minified={false}
              style={{right: -2, paddingTop: 5}}
              tags={[
                {
                  label: definition.computeKind,
                  onClick: () => {
                    window.requestAnimationFrame(() =>
                      document.dispatchEvent(new Event('show-kind-info')),
                    );
                  },
                },
              ]}
            />
          )}
        </AssetNodeBox>
      </AssetNodeContainer>
    </AssetInsetForHoverEffect>
  );
}, isEqual);

export const AssetNodeMinimal: React.FC<{
  selected: boolean;
  definition: AssetNodeFragment;
}> = ({selected, definition}) => {
  const {isSource, assetKey} = definition;
  const displayName = assetKey.path[assetKey.path.length - 1];

  return (
    <AssetInsetForHoverEffect>
      <MinimalAssetNodeContainer $selected={selected}>
        <MinimalAssetNodeBox $selected={selected} $isSource={isSource}>
          <MinimalName style={{fontSize: 30}} $isSource={isSource}>
            {withMiddleTruncation(displayName, {maxLength: 17})}
          </MinimalName>
        </MinimalAssetNodeBox>
      </MinimalAssetNodeContainer>
    </AssetInsetForHoverEffect>
  );
};

export const AssetRunLink: React.FC<{
  runId: string;
  event?: Parameters<typeof linkToRunEvent>[1];
}> = ({runId, children, event}) => (
  <Link
    to={event ? linkToRunEvent({runId}, event) : `/instance/runs/${runId}`}
    target="_blank"
    rel="noreferrer"
  >
    {children || titleForRun({runId})}
  </Link>
);

export const ASSET_NODE_LIVE_FRAGMENT = gql`
  fragment AssetNodeLiveFragment on AssetNode {
    id
    opNames
    repository {
      id
    }
    assetKey {
      path
    }
    assetMaterializations(limit: 1) {
      timestamp
      runId
    }
    assetObservations(limit: 1) {
      timestamp
      runId
    }
    currentLogicalVersion
    projectedLogicalVersion
  }
`;

// Note: This fragment should only contain fields that are needed for
// useAssetGraphData and the Asset DAG. Some pages of Dagit request this
// fragment for every AssetNode on the instance. Add fields with care!
//
export const ASSET_NODE_FRAGMENT = gql`
  fragment AssetNodeFragment on AssetNode {
    id
    graphName
    jobNames
    opNames
    opVersion
    description
    computeKind
    isSource
    isVersioned
    assetKey {
      path
    }
  }
`;

const AssetInsetForHoverEffect = styled.div`
  padding: 10px 4px 2px 4px;
  height: 100%;
`;

export const AssetNodeContainer = styled.div<{$selected: boolean}>`
  padding: 4px;
`;

export const AssetNodeBox = styled.div<{$isSource: boolean; $selected: boolean}>`
  ${(p) =>
    p.$isSource
      ? `border: 2px dashed ${p.$selected ? Colors.Gray500 : Colors.Gray300};`
      : `border: 2px solid ${p.$selected ? Colors.Blue500 : Colors.Blue200};`}

  background: ${Colors.White};
  border-radius: 5px;
  position: relative;
  &:hover {
    box-shadow: rgba(0, 0, 0, 0.12) 0px 2px 12px 0px;
  }
`;

const Name = styled.div<{$isSource: boolean}>`
  /** Keep in sync with DISPLAY_NAME_PX_PER_CHAR */
  display: flex;
  padding: 3px 6px;
  background: ${(p) => (p.$isSource ? Colors.Gray100 : Colors.Blue50)};
  font-family: ${FontFamily.monospace};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  font-weight: 600;
  gap: 4px;
`;

const MinimalAssetNodeContainer = styled(AssetNodeContainer)`
  outline: ${(p) => (p.$selected ? `2px dashed ${NodeHighlightColors.Border}` : 'none')};
  border-radius: 12px;
  outline-offset: 2px;
  outline-width: 4px;
  height: 100%;
`;

const MinimalAssetNodeBox = styled(AssetNodeBox)`
  background: ${Colors.White};
  ${(p) =>
    p.$isSource
      ? `border: 5px dashed ${p.$selected ? Colors.Gray500 : Colors.Gray300};`
      : `border: 5px solid ${p.$selected ? Colors.Blue500 : Colors.Blue200};`}
  border-radius: 10px;
  position: relative;
  padding: 4px;
  height: 100%;
  min-height: 46px;
`;

const MinimalName = styled(Name)`
  font-weight: 600;
  white-space: nowrap;
  position: absolute;
  background: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Description = styled.div`
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${Colors.Gray700};
  border-top: 1px solid ${Colors.Blue50};
  font-size: 12px;
`;

export const VersionedBadge: React.FC<{isStale: boolean; isSource: boolean}> = ({
  isStale,
  isSource,
}) => (
  <svg
    width="16px"
    height="16px"
    viewBox="0 0 16 16"
    version="1.1"
    style={{alignSelf: 'center'}}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g
      fill={
        isSource
          ? VERSION_COLORS.sourceText
          : isStale
          ? VERSION_COLORS.staleText
          : VERSION_COLORS.okText
      }
    >
      <path d="M8,0 C12.418278,-8.11624501e-16 16,3.581722 16,8 C16,12.418278 12.418278,16 8,16 C3.581722,16 5.41083001e-16,12.418278 0,8 C-5.41083001e-16,3.581722 3.581722,8.11624501e-16 8,0 Z M10.4147943,3.71254738 L7.999,10.151 L5.58520574,3.71254738 L3.71254738,4.41479426 L7.06367082,13.3511234 L8.93632918,13.3511234 L12.2874526,4.41479426 L10.4147943,3.71254738 Z" />
    </g>
  </svg>
);

const Stats = styled.div`
  padding: 4px 8px;
  border-top: 1px solid ${Colors.Blue50};
  font-size: 12px;
  line-height: 20px;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  min-height: 18px;
  & > span {
    color: ${Colors.Gray700};
  }
`;

const UpstreamNotice = styled.div`
  background: ${Colors.Yellow200};
  color: ${Colors.Yellow700};
  line-height: 10px;
  font-size: 11px;
  text-align: right;
  margin-top: -4px;
  margin-bottom: -4px;
  padding: 2.5px 5px;
  margin-right: -6px;
  border-top-right-radius: 3px;
`;

const LogicalVersionTag = styled.div<{$isSource: boolean; $isStale: boolean}>`
  background: ${(p) =>
    p.$isSource
      ? VERSION_COLORS.sourceBackground
      : p.$isStale
      ? VERSION_COLORS.staleBackground
      : VERSION_COLORS.okBackground};
  color: ${(p) => (p.$isStale ? VERSION_COLORS.staleText : VERSION_COLORS.okText)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  padding: 0 4px;
`;

const LogicalVersion: React.FC<{
  value: string;
  isStale: boolean;
  isSource: boolean;
}> = ({value, isStale, isSource}) => (
  <Box flex={{gap: 4, alignItems: 'center'}}>
    <Tooltip content={value}>
      <LogicalVersionTag $isSource={isSource} $isStale={isStale}>
        {value}
      </LogicalVersionTag>
    </Tooltip>
  </Box>
);

export const ComputeStatusNotice: React.FC<{computeStatus: AssetComputeStatus}> = ({
  computeStatus,
}) =>
  computeStatus === AssetComputeStatus.OUT_OF_DATE ? (
    <UpstreamNotice>
      upstream
      <br />
      changed
    </UpstreamNotice>
  ) : null;

export const AssetLatestRunWithNotices: React.FC<{
  liveData?: LiveDataForNode;
}> = ({liveData}) => {
  const {
    lastMaterialization,
    unstartedRunIds,
    inProgressRunIds,
    runWhichFailedToMaterialize,
    stepKey,
  } = liveData || MISSING_LIVE_DATA;

  return inProgressRunIds?.length > 0 ? (
    <Box flex={{gap: 4, alignItems: 'center'}}>
      <Tooltip content="A run is currently rematerializing this asset.">
        <Spinner purpose="body-text" />
      </Tooltip>
      <AssetRunLink runId={inProgressRunIds[0]} />
    </Box>
  ) : unstartedRunIds?.length > 0 ? (
    <Box flex={{gap: 4, alignItems: 'center'}}>
      <Tooltip content="A run has started that will rematerialize this asset soon.">
        <Spinner purpose="body-text" stopped />
      </Tooltip>
      <AssetRunLink runId={unstartedRunIds[0]} />
    </Box>
  ) : runWhichFailedToMaterialize?.__typename === 'Run' ? (
    <Box flex={{gap: 4, alignItems: 'center'}}>
      <Tooltip
        content={`Run ${titleForRun({
          runId: runWhichFailedToMaterialize.id,
        })} failed to materialize this asset`}
      >
        <Icon name="warning" color={Colors.Red500} />
      </Tooltip>
      <AssetRunLink runId={runWhichFailedToMaterialize.id} />
    </Box>
  ) : lastMaterialization ? (
    <AssetRunLink
      runId={lastMaterialization.runId}
      event={{stepKey, timestamp: lastMaterialization.timestamp}}
    />
  ) : (
    <span>–</span>
  );
};
