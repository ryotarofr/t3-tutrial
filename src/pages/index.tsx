import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relatineTime from "dayjs/plugin/relativeTime"
import Image from "next/image";

dayjs.extend(relatineTime)

const CreatePostWizard = () => {
  const { user } = useUser()

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
      <input placeholder="Type some emojis!" className="bg-transparent grow outline-none" />
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
        <span>{post.content}</span>
      </div>
    </div>
  )
}

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const user = useUser()

  const { data, isLoading } = api.posts.getAll.useQuery()

  if (isLoading) return <div>Loading...</div>

  if (!data) return <div>ポストデータはありません</div>
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
            {/* {!user.isSignedIn ? <SignInButton /> : <SignOutButton />} */}
            {!user.isSignedIn && <SignInButton />}
            {user.isSignedIn && <CreatePostWizard />}

            {!!user.isSignedIn && <SignOutButton />}
          </div>
          <div>
            {data?.map((fullPost) => (<PostsView {...fullPost} key={fullPost.post.id} />))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
