import React, { useState, useEffect } from 'react';
import { recommendations } from '../lib/api';

type Job = {
  _id: string;
  job_title: string;
  job_description: string;
  Company: string;
  category: string;
  score: number;
};

export function JobRecommendations() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await recommendations.getJobRecommendations(5);
        setJobs(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch job recommendations:', err);
        setError(err.response?.data?.message || 'Failed to load job recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading recommendations...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        <p className="font-medium">Error</p>
        <p>{error}</p>
        <p className="mt-2 text-sm">
          Make sure you've uploaded your resume in your profile to get personalized recommendations.
        </p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
        <p>No job recommendations available yet.</p>
        <p className="mt-2 text-sm">
          Upload or update your resume in your profile to get personalized job recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Job Recommendations</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Based on your resume, we've found these job matches for you:
      </p>
      
      {jobs.map((job) => (
        <div 
          key={job._id}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg">{job.job_title}</h3>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium rounded">
              {(job.score * 100).toFixed(0)}% match
            </span>
          </div>
          
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {job.Company} · {job.category}
          </div>
          
          <p className="mt-2 text-sm">{job.job_description}</p>
          
          <div className="mt-3 flex justify-end">
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 