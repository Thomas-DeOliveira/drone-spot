"use client";
import { useState, useRef, useEffect } from "react";
import { User, Camera, X, Upload } from "lucide-react";
import AvatarCropDialog from "./AvatarCropDialog";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName: string;
  onAvatarChange: (avatarUrl: string) => void;
  editable?: boolean;
}

export default function AvatarUpload({ currentAvatar, userName, onAvatarChange, editable = true }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // Synchroniser l'aperçu avec currentAvatar seulement si pas d'upload en cours
  useEffect(() => {
    if (!isUploading) {
      setPreview(currentAvatar || null);
    }
  }, [currentAvatar, isUploading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setError("");
    
    // Ouvrir le crop d'abord avec un DataURL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCropSrc(dataUrl);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/auth/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPreview(data.avatarUrl);
        onAvatarChange(data.avatarUrl);
      } else {
        setError(data.error || "Erreur lors de l'upload");
        setPreview(currentAvatar || null);
      }
    } catch (error) {
      setError("Erreur de connexion");
      setPreview(currentAvatar || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropConfirm = async (blob: Blob) => {
    // Transformer en File pour l’API
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    setIsCropOpen(false);
    await uploadAvatar(file);
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/remove-avatar", {
        method: "POST",
      });

      if (response.ok) {
        onAvatarChange("");
        setPreview(null);
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Photo de profil"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">
                {getInitials(userName)}
              </span>
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {editable && (
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md disabled:opacity-50"
          >
            <Camera className="w-4 h-4 mr-2" />
            {preview ? "Changer" : "Ajouter"}
          </button>
          
          {preview && (
            <button
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
            >
              <X className="w-4 h-4 mr-2" />
              Supprimer
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AvatarCropDialog
        open={isCropOpen}
        onOpenChange={setIsCropOpen}
        imageSrc={cropSrc || ""}
        onConfirm={handleCropConfirm}
        cropSize={96}
      />

      {editable && error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {editable && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Formats acceptés : JPG, PNG, GIF. Taille max : 5MB
        </p>
      )}
    </div>
  );
}
