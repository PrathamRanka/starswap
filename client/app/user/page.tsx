"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RepoSubmissionCard } from "@/components/RepoSubmissionCard";

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  fork: boolean;
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState("");

  // Only run when we have a user
  useEffect(() => {
    if (!user?.username) return;

    let mounted = true;
    const fetchGithubRepos = async () => {
      setLoadingRepos(true);
      try {
        // Fetch direct from GitHub API
        const response = await fetch(`https://api.github.com/users/${user.username}/repos?sort=updated&per_page=100`);
        if (!response.ok) throw new Error("Failed to fetch public repositories.");
        
        const data: GithubRepo[] = await response.json();
        
        if (mounted) {
          // Filter out forks so they only submit original work
          setRepos(data.filter(repo => !repo.fork));
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (mounted) setRepoError(error.message || "Something went wrong fetching repos.");
      } finally {
        if (mounted) setLoadingRepos(false);
      }
    };

    fetchGithubRepos();

    return () => { mounted = false; };
  }, [user]);

  if (!user) return null; // handled by layout

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={`${user.username}'s avatar`}
                className="w-20 h-20 rounded-full object-cover shadow-xl border-2 border-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold font-mono shadow-xl border-2 border-white/10">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            {/* The Green Connection Status */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-black rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome, {user.username}</h1>
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 px-3 py-1 rounded-full w-fit border border-green-400/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Connected to GitHub
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-center">
           <div className="bg-black/50 px-6 py-4 rounded-2xl border border-white/5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Rank Score</p>
              <p className="text-2xl font-mono font-bold">{user.leaderboardScore}</p>
           </div>
           <div className="bg-black/50 px-6 py-4 rounded-2xl border border-white/5">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Daily Streak</p>
              <p className="text-2xl font-mono font-bold flex items-center justify-center gap-2">🔥 {user.streakCount}</p>
           </div>
        </div>
      </section>

      {/* Repositories Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-3">
             <svg className="w-6 h-6 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
             Your Public Repositories
          </h2>
          <p className="text-white/50 pb-4 border-b border-white/10">Select an original project to pitch to the StarSwap ecosystem.</p>
        </div>

        {loadingRepos && (
          <div className="py-20 flex justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-t-2 border-white rounded-full" />
          </div>
        )}

        {repoError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
            {repoError}
          </div>
        )}

        {!loadingRepos && !repoError && repos.length === 0 && (
          <div className="text-center py-20 text-white/50 border border-dashed border-white/10 rounded-3xl">
            We couldn&apos;t find any public, original (non-forked) repositories under your account.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {repos.map(repo => (
            <RepoSubmissionCard 
              key={repo.id}
              githubRepoId={repo.full_name}
              name={repo.name}
              description={repo.description}
              language={repo.language}
              stars={repo.stargazers_count}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
