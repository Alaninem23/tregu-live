import { useEffect, useState } from "react";
import { FeedAPI } from "../api";
import { useAuth } from "../auth/AuthContext";

export default function NewsFeed() {
  const [posts, setPosts] = useState([]);
  const { auth } = useAuth();

  useEffect(() => { FeedAPI.list().then(setPosts).catch(()=>{}); }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">Sellers’ News Feed</h2>
      <div className="grid gap-3">
        {posts.map(p => (
          <article key={p.id} className="border p-3 rounded">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm opacity-80">by {p.seller_name} • {new Date(p.created_at).toLocaleString()}</p>
            <p className="mt-2">{p.body}</p>
          </article>
        ))}
        {posts.length === 0 && <p>No posts yet.</p>}
      </div>

      {auth.user?.role === "seller" && <PostComposer />}
    </div>
  );
}

function PostComposer() {
  const [title,setTitle]=useState(""); const [body,setBody]=useState("");
  const { auth } = useAuth();

  async function submit(e){
    e.preventDefault();
    await fetch(import.meta.env.VITE_API_BASE_URL + "/feed/post",{
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${auth.access}` },
      body: JSON.stringify({ title, body })
    });
    location.reload();
  }

  return (
    <form onSubmit={submit} className="mt-6 border p-3 rounded">
      <h4 className="font-semibold mb-2">Create a post</h4>
      <input className="border p-2 w-full mb-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="border p-2 w-full mb-2" placeholder="Body" rows={4} value={body} onChange={e=>setBody(e.target.value)} />
      <button className="border px-3 py-1 rounded">Publish</button>
    </form>
  );
}

