import { Recipe } from "@/services/api";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { DialogHeader, DialogTitle } from "./ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { UploadIcon } from "lucide-react";

export function UploadImageHeader({
  editedRecipe,
  setEditedRecipe,
}: {
  editedRecipe: Recipe;
  setEditedRecipe: Dispatch<SetStateAction<Recipe | null>>;
}) {
  // Observes whether the image is hovered over. Needed so  we know whether to
  // show the upload overlay.
  const [isImageHovered, setIsImageHovered] = useState(false);

  // A ref to the hidden file input element.  It is triggered by clicking the
  // upload overlay.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retrieves the image from the file system, gives it a URL, and sets it
  // as the image URL.
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) return;

    const blobUrl = URL.createObjectURL(file);
    setEditedRecipe((prev) => (prev ? { ...prev, imgUrl: blobUrl } : prev));
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <DialogHeader>
        <VisuallyHidden.Root asChild>
          <DialogTitle>Edit Recipe</DialogTitle>
        </VisuallyHidden.Root>
        {editedRecipe.imgUrl ? (
          <div
            className="group relative aspect-4/3 w-[calc(100%+3rem)] max-w-none
                       -mx-6 -mt-6 mb-4 rounded-t-lg
                       flex flex-col items-center justify-center gap-2
                       text-muted-foreground transition-colors
                       cursor-pointer overflow-hidden
                       bg-cover bg-center"
            style={{
              backgroundImage: `url(${editedRecipe.imgUrl})`,
            }}
            onMouseEnter={() => setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="absolute inset-0 transition-colors duration-200
                         bg-black/0 group-hover:bg-black/70"
            />
            {isImageHovered && (
              <>
                <UploadIcon className="relative z-10 h-12 w-12" />
                <span className="relative z-10 text-sm font-medium">
                  Upload Image
                </span>
              </>
            )}
          </div>
        ) : (
          <div
            className="aspect-4/3 w-[calc(100%+3rem)] max-w-none
                       -mx-6 -mt-6 mb-4 rounded-t-lg
                       flex flex-col items-center justify-center gap-2
                       text-muted-foreground border-2 transition-colors
                       cursor-pointer hover:bg-accent/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="h-12 w-12" />
            <span className="text-sm font-medium">Upload Image</span>
          </div>
        )}
      </DialogHeader>
    </>
  );
}
