// src/app/dashboard/projects/new/page.tsx
import { ProjectForm } from "@/components/project-form";

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell LeadScout what you sell and where to look. It scans automatically and keeps only the posts worth answering.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
