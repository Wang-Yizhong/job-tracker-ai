"use client";
import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { Megaphone } from "lucide-react"; // ← 导入喇叭图标

type Props = {
  autoOnce?: boolean;
  controlledOpen?: boolean;
  onCloseControlled?: () => void;
};

export default function AnnouncementModal({
  autoOnce = true,
  controlledOpen,
  onCloseControlled,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof controlledOpen === "boolean") {
      setOpen(controlledOpen);
      return;
    }

    if (!autoOnce) {
      setOpen(true);
      return;
    }

    const KEY = "onboardSeen";
    if (!localStorage.getItem(KEY)) {
      setOpen(true);
      localStorage.setItem(KEY, "1");
    }
  }, [autoOnce, controlledOpen]);

  const handleClose = () => {
    if (typeof controlledOpen === "boolean") {
      onCloseControlled?.();
    } else {
      setOpen(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      {/* 标题区：加图标 */}
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-slate-900">
          Willkommen im Job Tracker (MVP)
        </h2>
      </div>

      <div className="space-y-3 text-sm text-slate-700">
        <p>Dies ist eine frühe MVP-Version zu Demonstrationszwecken.</p>
        <div>
          <p className="mb-1 font-medium">Aktuell (MVP):</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Registrierung & Anmeldung mit E-Mail-Verifizierung</li>
            <li>Stellenverwaltung (Erstellen, Bearbeiten, Löschen, Listenansicht)</li>
            <li>Lebenslauf-Upload & Parsing, strukturierte Anzeige und Editieren</li>
            <li>Export als PDF (A4) für deinen Lebenslauf</li>
          </ul>
        </div>
        <div>
          <p className="mb-1 font-medium">Geplante Funktionen:</p>
          <ul className="list-disc pl-5 space-y-1">
           <li>Übersicht & Analyse</li> 
            <li>E-Mail-Erinnerungen (Deadlines & Follow-ups)</li>
            <li>KI-Verbesserung für Lebenslauf-Felder</li>
            <li>Bewerbungsstatus-Board & Team-Notizen</li>
            <li>Performance- & Sicherheitshärtung</li>
          </ul>
        </div>
     {/*    <p className="text-xs text-slate-500">
          Bitte gib keine sensiblen Echtdaten ein. Du kannst dein persönliches Konto jederzeit in
          den Profileinstellungen <span className="font-medium">löschen</span>. Das öffentliche
          Demo-Konto wird regelmäßig zurückgesetzt.
        </p> */}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Verstanden
          </button>
        </div>
      </div>
    </Modal>
  );
}
