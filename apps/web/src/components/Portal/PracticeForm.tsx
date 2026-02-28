"use client";

import { useState } from 'react';
import { Button } from "@careequity/ui";
import { IDENTITY_TAGS } from '@careequity/core';

interface PracticeFormProps {
  provider: {
    id: string;
    name: string;
    bio?: string;
    telehealth_url?: string;
    website_url?: string;
    profile_image_url?: string;
    identity_tags?: string[];
  };
}

export default function PracticeForm({ provider }: PracticeFormProps) {
  const [bio, setBio] = useState(provider.bio || '');
  const [telehealthUrl, setTelehealthUrl] = useState(provider.telehealth_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(provider.website_url || '');
  const [profileImageUrl, setProfileImageUrl] = useState(provider.profile_image_url || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(provider.identity_tags || []);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${API_URL}/providers/${provider.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio,
          telehealth_url: telehealthUrl,
          website_url: websiteUrl,
          profile_image_url: profileImageUrl,
          identity_tags: selectedTags,
        }),
      });

      if (res.ok) {
        alert('Practice updated successfully!');
      } else {
        const err = await res.json();
        alert(`Update failed: ${err.message}`);
      }
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium">Provider Name</label>
        <input
          type="text"
          value={provider.name}
          disabled
          className="w-full p-2 border rounded bg-slate-50 text-slate-500 cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block mb-2 text-sm font-medium">About You</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary resize-y text-sm"
          placeholder="Tell patients about your background and approach to care"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Cultural Competency</label>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-primary hover:text-primary'
              }`}
              aria-pressed={selectedTags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Website URL (triggers automatic photo lookup)</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          placeholder="https://www.yourpractice.com"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Telehealth URL</label>
        <input
          type="url"
          value={telehealthUrl}
          onChange={(e) => setTelehealthUrl(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          placeholder="https://telehealth.provider.com/your-room"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Profile Image URL (manual override)</label>
        <input
          type="url"
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          placeholder="https://path-to-your-photo.jpg"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
