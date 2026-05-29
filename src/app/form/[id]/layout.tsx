import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("title, description")
    .eq("id", resolvedParams.id)
    .single();

  if (!form) {
    return {
      title: "Form Not Found",
    };
  }

  const title = `${form.title} | eZForms`;
  const description = form.description || "Vote now — results update live. Join the room on eZForms.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://ezforms.app/form/${resolvedParams.id}/fill`,
      siteName: "eZForms",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: form.title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
