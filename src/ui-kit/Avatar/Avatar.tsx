import { memo, useState } from 'react';

import styles from './styles/Avatar.module.css';
import { classNames, getInitials } from '@app/utils';

export interface IAvatar {
  name: string;
  url?: string | null;
  onError?: () => void;
  size?: 'regular' | 'small';
}

export const Avatar = memo<IAvatar>(({ name, url, size = 'regular', onError }) => {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  const sizeClass = size === 'small' && styles.small;
  const broken = url !== undefined && url !== null && brokenUrl === url;

  if (url && !broken) {
    return (
      <img
        alt=""
        src={url}
        loading="lazy"
        onError={() => {
          setBrokenUrl(url);
          onError?.();
        }}
        className={classNames(styles.avatar, styles.image, sizeClass)}
      />
    );
  }

  return <span className={classNames(styles.avatar, sizeClass)}>{getInitials(name)}</span>;
});

Avatar.displayName = 'Avatar';
