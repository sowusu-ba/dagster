import {
  Box,
  ButtonLink,
  Checkbox,
  Colors,
  Heading,
  MetadataTable,
  PageHeader,
  Subheading,
} from '@dagster-io/ui';
import * as React from 'react';

import {useDocumentTitle} from '../hooks/useDocumentTitle';
import {useStateWithStorage} from '../hooks/useStateWithStorage';

import {FeatureFlag, FeatureFlagType, getFeatureFlags, setFeatureFlags} from './Flags';
import {SHORTCUTS_STORAGE_KEY} from './ShortcutHandler';
import {useTrackPageView} from './analytics';
import {TimezoneSelect} from './time/TimezoneSelect';
import {automaticLabel} from './time/browserTimezone';

export interface SettingsRootProps {
  tabs?: React.ReactNode;
}
const UserSettingsRoot: React.FC<SettingsRootProps> = ({tabs}) => {
  useTrackPageView();
  useDocumentTitle('User settings');

  const [flags, setFlags] = React.useState<FeatureFlagType[]>(() => getFeatureFlags());
  const [shortcutsEnabled, setShortcutsEnabled] = useStateWithStorage(
    SHORTCUTS_STORAGE_KEY,
    (value: any) => (typeof value === 'boolean' ? value : true),
  );

  React.useEffect(() => {
    setFeatureFlags(flags);
  });

  const toggleFlag = (flag: FeatureFlagType) => {
    setFlags(flags.includes(flag) ? flags.filter((f) => f !== flag) : [...flags, flag]);
    window.location.reload();
  };

  const trigger = React.useCallback(
    (timezone: string) => (
      <ButtonLink>{timezone === 'Automatic' ? automaticLabel() : timezone}</ButtonLink>
    ),
    [],
  );

  const toggleKeyboardShortcuts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {checked} = e.target;
    setShortcutsEnabled(checked);
    // Delay slightly so that the switch visibly changes first.
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div style={{height: '100vh', overflowY: 'auto'}}>
      <PageHeader title={<Heading>User settings</Heading>} tabs={tabs} />
      <Box padding={{vertical: 16, horizontal: 24}}>
        <Box padding={{bottom: 8}}>
          <Subheading>Preferences</Subheading>
        </Box>
        <MetadataTable
          rows={[
            {
              key: 'Timezone',
              value: (
                <Box margin={{bottom: 4}}>
                  <TimezoneSelect trigger={trigger} />
                </Box>
              ),
            },
            {
              key: 'Enable keyboard shortcuts',
              value: (
                <Checkbox
                  checked={shortcutsEnabled}
                  format="switch"
                  onChange={toggleKeyboardShortcuts}
                />
              ),
            },
          ]}
        />
      </Box>
      <Box
        padding={{vertical: 16, horizontal: 24}}
        border={{side: 'top', width: 1, color: Colors.KeylineGray}}
      >
        <Box padding={{bottom: 8}}>
          <Subheading>Experimental features</Subheading>
        </Box>
        <MetadataTable rows={getFeatureFlagRows(flags, toggleFlag)} />
      </Box>
    </div>
  );
};

export function getFeatureFlagRows(
  flags: FeatureFlagType[],
  toggleFlag: (flag: FeatureFlagType) => void,
) {
  return [
    {
      key: 'Debug console logging',
      value: (
        <Checkbox
          format="switch"
          checked={flags.includes(FeatureFlag.flagDebugConsoleLogging)}
          onChange={() => toggleFlag(FeatureFlag.flagDebugConsoleLogging)}
        />
      ),
    },
    {
      key: 'Disable WebSockets',
      value: (
        <Checkbox
          format="switch"
          checked={flags.includes(FeatureFlag.flagDisableWebsockets)}
          onChange={() => toggleFlag(FeatureFlag.flagDisableWebsockets)}
        />
      ),
    },
    {
      key: 'New asset detail pages',
      value: (
        <Checkbox
          format="switch"
          checked={flags.includes(FeatureFlag.flagNewAssetDetails)}
          onChange={() => toggleFlag(FeatureFlag.flagNewAssetDetails)}
        />
      ),
    },
    {
      key: 'Experimental "groups-only" asset graph zoom level',
      value: (
        <Checkbox
          format="switch"
          checked={flags.includes(FeatureFlag.flagAssetGraphExperimentalZoom)}
          onChange={() => toggleFlag(FeatureFlag.flagAssetGraphExperimentalZoom)}
        />
      ),
    },
  ];
}

// Imported via React.lazy, which requires a default export.
// eslint-disable-next-line import/no-default-export
export default UserSettingsRoot;
