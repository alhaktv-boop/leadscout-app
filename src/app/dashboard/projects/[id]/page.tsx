// src/app/dashboard/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm, type ProjectValues } from "@/components/project-form";
import { DeleteProjectButton } from "@/components/delete-project-button";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New keywords and subreddits apply from the next scan. Existing leads stay as they are.
        </p>
      </div>

      <ProjectForm project={project as ProjectValues} />

      <div className="max-w-2xl border-t pt-4">
        <DeleteProjectButton projectId={project.id} />
      </div>
    </div>
  );
}
