'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useLedger } from '@/context/ledger-context';

export function UploadCsvButton() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const { importCsv } = useLedger();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setBusy(true);

    try {
      const summary = await importCsv(file);
      toast.success(
        `Imported ${summary.importedCount} • Auto ${summary.autoCategorized} • Review ${summary.reviewCount}`,
      );
    } catch (error) {
      console.error(error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="btn bg-primary text-white px-4 py-2 rounded-md hover:opacity-90 transition"
        disabled={busy}
      >
        {busy ? 'Importing…' : 'Import CSV'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
