// 导入Remix后端运行时的类型和函数
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { prisma } from "~/prisma.server";
// 导入Remix React工具库的一些功能，包括处理JSON响应、链接组件、加载数据钩子和搜索参数钩子
import { json, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import dayjs from "dayjs";
import { Pagination } from "@nextui-org/react";

// 定义页面的元数据，如标题和描述
export const meta: MetaFunction = () => {
  return [
    { title: "Remix Blog" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

// 设置每页显示的文章数量
const PAGE_SIZE = 2;

// 从URL中获取当前页码，并使用Prisma客户端并行执行两个数据库操作：获取当前页的文章和文章总数
export const loader = async (c: LoaderFunctionArgs) => {
  const search = new URL(c.request.url).searchParams;
  const page = Number(search.get("page") || 1);

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      orderBy: {
        create_at: "desc",
      },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.post.count(),
  ]);

  // 返回文章数据和总页数的JSON响应
  return json({
    posts,
    pageCount: Math.ceil(total / PAGE_SIZE),
  });
};

// 使用useLoaderData钩子获取loader函数加载的数据，并使用useSearchParams钩子来获取和设置URL的查询参数
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page"));

  return (
    <div>
      <div className="p-12 flex flex-col gap-4">
        {loaderData.posts.map((post) => {
          return (
            <div key={post.id}>
              <Link to={`/posts/${post.id}`} className="text-xl">
                {post.title}
              </Link>
              <div className="text-sm text-gray-500">
                {dayjs(post.create_at).format("YYYY-MM-DD HH:mm:ss")}
              </div>
            </div>
          );
        })}
        {/* 分页组件，允许用户浏览文章列表的不同页码 */}
        <Pagination
          page={page}
          total={loaderData.pageCount}
          onChange={(page) => {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set("page", String(page));
            setSearchParams(newSearchParams);
            // 分页组件页码变化时，更新URL的查询参数以反映新的页码
          }}
        />
      </div>
    </div>
  );
}
