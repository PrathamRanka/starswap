"use client";

import { useState } from "react";
import { repositoryApi } from "@/api/repository";

interface RepoSubmissionCardProps {
  githubRepoId: string; // The full_name e.g. "facebook/react"
  name: string;
  description: string;
  language: string;
  stars: number;
}

export function RepoSubmissionCard({ githubRepoId, name, description, language, stars }: RepoSubmissionCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pitch, setPitch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    // Exact contract validation: Max 180 chars. 
    // ~30-50 words is easily 150-250 characters, let's strictly cap it at 180 as per contract.
    if (pitch.length > 180) {
      setErrorMsg("Pitch must be 180 characters or less.");
      return;
    }
    
    // Give them a tiny minimum so they at least write something
    if (pitch.trim().length < 10) {
      setErrorMsg("Pitch is too short. Please write at least a short sentence.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const result = await repositoryApi.submitRepo({
      githubRepoId,
      pitch
    });

    setIsSubmitting(false);

    if (!result.success) {
      const code = result.error?.code;
      if (code === "ALREADY_SUBMITTED" || code === "CONFLICT") {
        setErrorMsg("You have already submitted this repository.");
      } else {
        setErrorMsg(result.error?.message || "Failed to submit repository.");
      }
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex items-center justify-center flex-col gap-3 min-h-[250px] transition-all">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl">✓</div>
        <p className="font-bold text-green-400 text-lg">Sent to Public!</p>
        <p className="text-white/50 text-sm text-center">&quot;{name}&quot; is now live in the Swipe Deck.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col justify-between group">
      <div>
        <h3 className="font-bold text-lg mb-1 truncate" title={name}>{name}</h3>
        <p className="text-sm text-white/60 mb-2 line-clamp-2 min-h-[40px] italic">&quot;{description || "No description provided."}&quot;</p>
        
        <div className="items-center gap-4 text-xs text-white/40 mb-6 font-mono bg-black/30 p-2 rounded-lg inline-flex w-fit border border-white/5">
          <span>{language || "Unknown"}</span>
          <span className="flex items-center gap-1">⭐ {stars}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea 
            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none placeholder:text-white/30"
            rows={3}
            placeholder="Write a 30 word pitch about this repo..."
            value={pitch}
            onChange={(e) => {
               setErrorMsg(""); 
               setPitch(e.target.value);
            }}
            maxLength={180}
            disabled={isSubmitting}
          />
          <div className={`absolute bottom-3 right-3 text-xs ${pitch.length === 180 ? 'text-red-400' : 'text-white/30'}`}>
            {pitch.length}/180
          </div>
        </div>

        {errorMsg && (
          <p className="text-red-400 text-xs text-center">{errorMsg}</p>
        )}

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || pitch.length === 0}
          className="w-full py-2.5 bg-linear-to-r from-white to-gray-300 text-black font-semibold rounded-xl hover:from-white hover:to-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          {isSubmitting ? (
             <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Publishing...
             </div>
          ) : (
             "Send to Public"
          )}
        </button>
      </div>
    </div>
  );
}
