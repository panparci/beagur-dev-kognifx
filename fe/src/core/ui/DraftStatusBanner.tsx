import React, { memo } from 'react';

type DraftStatusBannerProps = {
  isDirty: boolean;
  label?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

const DraftStatusBanner: React.FC<DraftStatusBannerProps> = ({ isDirty, label, action }) => {
  if (!isDirty) return null;

  return (
    <div className="portal-banner portal-banner--warn flex flex-wrap items-center justify-between gap-2" role="status">
      <span>
        {label ?? 'Perubahan belum disimpan — draft aman di perangkat Anda sampai tombol Simpan/Ajukan ditekan.'}
      </span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold underline underline-offset-2 hover:no-underline shrink-0"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default memo(DraftStatusBanner);
