import { Job } from "@/hooks/useJobs";

export interface EmployerGroup {
  employerId: string;
  jobs: Job[];
  lat: number;
  lng: number;
}

/**
 * Groups jobs by employer (owner_id).
 * For groups with multiple jobs, uses the centroid of all job coordinates.
 * Returns single jobs as groups of 1 for uniform handling.
 */
export function groupJobsByEmployer(jobs: Job[]): EmployerGroup[] {
  const employerMap = new Map<string, Job[]>();
  
  // Group jobs by owner_id
  for (const job of jobs) {
    if (!job.owner_id || job.lat == null || job.lng == null) continue;
    
    const existing = employerMap.get(job.owner_id);
    if (existing) {
      existing.push(job);
    } else {
      employerMap.set(job.owner_id, [job]);
    }
  }
  
  // Convert to EmployerGroup array with calculated positions
  const groups: EmployerGroup[] = [];
  
  for (const [employerId, employerJobs] of employerMap) {
    // Calculate centroid for position
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;
    
    for (const job of employerJobs) {
      if (job.lat != null && job.lng != null) {
        totalLat += job.lat;
        totalLng += job.lng;
        count++;
      }
    }
    
    if (count === 0) continue;
    
    groups.push({
      employerId,
      jobs: employerJobs,
      lat: totalLat / count,
      lng: totalLng / count,
    });
  }
  
  return groups;
}
