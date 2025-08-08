import * as React from 'react';

interface SaveAllButtonProps {
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

export const SaveAllButton: React.FC<SaveAllButtonProps> = ({ onSave, isSaving }) => {
  return (
    <button
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow transition disabled:opacity-60"
      onClick={onSave}
      disabled={isSaving}
      title="Guardar todos los avances"
    >
      {isSaving ? 'Guardando...' : 'Guardar avances'}
    </button>
  );
};
