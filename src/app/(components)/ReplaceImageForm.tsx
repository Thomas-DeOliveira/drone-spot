"use client";

import * as React from "react";

type ReplaceImageFormProps = {
  targetFormId: string;
  inputName?: string; // default: newImage
};

export default function ReplaceImageForm({ targetFormId, inputName = "newImage" }: ReplaceImageFormProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    // autosubmit target form (not the main form)
    const form = document.getElementById(targetFormId) as HTMLFormElement | null;
    if (form) form.requestSubmit();
  };

  return (
    <>
      <input ref={inputRef} type="file" name={inputName} accept="image/*" className="hidden" onChange={handleChange} form={targetFormId} />
      <button type="button" className="h-8 px-2 rounded-md border bg-background text-sm" onClick={handleClick}>
        Changer
      </button>
    </>
  );
}


