import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relatineTime from "dayjs/plugin/relativeTime"
import Image from "next/image";
import { Loading } from "~/components/Loading";
import { useState } from "react";

dayjs.extend(relatineTime)

const CreatePostWizard = () => {
  const { user } = useUser()

  const ctx = api.useContext()

  const [input, setInput] = useState("")

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("")
      // void(関数を明示的に無視)することでgetAllのキャッシュがクリアされリロードなしでInputを表示できる
      void ctx.posts.getAll.invalidate()
    }
  })

  if (!user) return null
  return (
    <div className="flex w-full gap-3 pt-8">
      <Image
        src={user?.profileImageUrl}
        alt="Profile image"
        className="h-16 w-16 rounded-full"
        width={64}
        height={64}
      />
      <input
        placeholder="Type some emojis!"
        className="bg-transparent grow outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
      />
      <button onClick={() => mutate({ content: input })}>Post</button>
    </div>
  )
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number]
const PostsView = (props: PostWithUser) => {
  const { post, author } = props
  return (
    <div key={post.id} className="flex gap-3 border-b border-stone-400 p-4">
      <Image
        src={author.profileImageUrl}
        alt={`@${author.username}'s profile picture`}
        className="h-16 w-16 rounded-full"
        width={56}
        height={56}
      />
      <div>
        <div className="flex gap-1 text-slate-400">
          <span>{`@${author.username} `}</span>
          <span className="font-thin">
            {` : ${dayjs(post.createdAt).fromNow()}`}
          </span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  )
}

const Feed = () => {
  const { data, isLoading: postLoading } = api.posts.getAll.useQuery()

  if (postLoading) return <Loading />

  if (!data) return <div>ポストデータはありません</div>

  return (
    <div>
      {data.map((fullPost) => (
        <PostsView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  )
}

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const { isLoaded: userLoaded, isSignedIn } = useUser()

  api.posts.getAll.useQuery()

  if (!userLoaded) return <div />


  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="w-full border-x md:max-w-2xl">
          <div>
            {!isSignedIn && <SignInButton />}
            {isSignedIn && <CreatePostWizard />}

            {!!isSignedIn && <SignOutButton />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
