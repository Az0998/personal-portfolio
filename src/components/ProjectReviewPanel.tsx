import { reviewForTitle } from "@/data/project-reviews";

export function ProjectReviewPanel({ title }: { title: string }) {
  const review = reviewForTitle(title);
  if (!review) return null;
  return (
    <section className="mb-10 rounded-2xl border border-white/15 bg-black/25 p-5 text-sm text-white/80">
      <p className="text-xs tracking-[0.16em] text-[#7bdff2]">工程备忘</p>
      <p className="mt-2">
        <span className="text-white/50">阶段</span> {review.stage}
      </p>
      <p className="mt-1">
        <span className="text-white/50">栈</span> {review.stack}
      </p>
      <p className="mt-1">
        <span className="text-white/50">边界</span> {review.limit}
      </p>
      <p className="mt-1">
        <span className="text-white/50">下一步</span> {review.next}
      </p>
    </section>
  );
}
