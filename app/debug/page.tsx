export default function Debug() {
  return (
    <div className="p-10 space-y-4">
      <p>
        URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>

      <p>
        KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 25)}
      </p>
    </div>
  );
}