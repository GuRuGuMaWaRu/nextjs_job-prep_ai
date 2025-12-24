"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@core/components/ui/form";
import { Input } from "@core/components/ui/input";
import { Textarea } from "@core/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@core/components/ui/select";
import { Button } from "@core/components/ui/button";
import { LoadingSwap } from "@core/components/ui/loading-swap";
import { experienceLevels, JobInfoTable } from "@/core/drizzle/schema";

import { jobInfoSchema } from "../schemas";
import { formatExperienceLevel } from "../lib/formatters";
import { createJobInfoAction, updateJobInfoAction } from "../actions";
import { routes } from "@/core/data/routes";

type JobInfoFormData = z.infer<typeof jobInfoSchema>;

export function JobInfoForm({
  jobInfo,
}: {
  jobInfo?: Pick<
    typeof JobInfoTable.$inferSelect,
    "id" | "name" | "title" | "description" | "experienceLevel"
  >;
}) {
  const router = useRouter();
  const form = useForm<JobInfoFormData>({
    resolver: zodResolver(jobInfoSchema),
    defaultValues: jobInfo ?? {
      name: "",
      title: null,
      experienceLevel: "junior",
      description: "",
    },
  });

  async function onSubmit(values: JobInfoFormData) {
    const action = jobInfo
      ? updateJobInfoAction.bind(null, jobInfo.id)
      : createJobInfoAction;

    const res = await action(values);

    if (!res.success) {
      toast.error(res.message);
    } else {
      toast.success(
        jobInfo ? "Job information updated!" : "Job information created!"
      );
      router.push(routes.jobInfo(res.data.id));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be associated with your job info.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormDescription>
                  Optional. The title of the job you are applying for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {formatExperienceLevel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A Next.js 15 and React 19 full stack web developer job that uses Drizzle ORM and Postgres for database management."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Be as specific as possible. The more information you provide,
                the better the interviews will be.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full">
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            Save Job Information
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
