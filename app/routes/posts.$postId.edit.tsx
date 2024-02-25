import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { prisma } from "~/prisma.server";
import {
  Form,
  json,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { Button, Input, Textarea } from "@nextui-org/react";

// 定义 loader 函数，异步加载文章数据
// LoaderFunctionArgs 包含了 request、params 和 context 等属性
export const loader = async (c: LoaderFunctionArgs) => {
  // 从 URL 参数中获取 postId
  const postId = c.params.postId as string;
  // 使用 prisma 客户端查询唯一的文章
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
  });

  // 如果没有找到文章，抛出 404 错误
  if (!post) {
    throw new Response("Can not find the article", {
      status: 404,
    });
  }

  // 返回文章数据，使用 json 方法包装以适配响应格式
  return json({
    post,
  });
};

// 定义 action 函数，处理文章更新的表单提交
export const action = async (c: ActionFunctionArgs) => {
  // 从 URL 参数中获取 postId
  const postId = c.params.postId as string;
  // 获取表单数据
  const formData = await c.request.formData();
  // 从表单数据中提取 title, content, slug
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const slug = formData.get("slug") as string;

  // 使用 prisma 客户端更新文章数据
  await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      id: slug,
      title,
      content,
    },
  });

  // 更新完成后重定向到更新后的文章页面
  return redirect(`/posts/${slug}`);
};

// 定义页面的 React 组件
export default function Page() {
  // 使用 useLoaderData 钩子获取 loader 函数加载的数据
  const loaderData = useLoaderData<typeof loader>();
  // 使用 useNavigation 钩子获取导航状态，用于处理表单提交状态
  const navigation = useNavigation();
  const deleteFetcher = useFetcher();
  const isDeleting = deleteFetcher.state === "submitting";
  const isEditing =
    navigation.state === "submitting" &&
    navigation.formData?.get("action") === "edit";
  // 渲染文章编辑表单
  return (
    <div className="p-12">
      <Form method="post">
        <div className="flex flex-col gap-3">
          {/* 使用 Input 组件创建 slug 输入框，初始值为文章的 id*/}
          <Input label="slug" name="slug" defaultValue={loaderData.post.id} />
          {/* 创建标题输入框，初始值为文章标题*/}
          <Input
            label="标题"
            name="title"
            defaultValue={loaderData.post.title}
          />
          {/* 创建正文输入框，初始值为文章内容*/}
          <Textarea
            minRows={10}
            label="正文"
            name="content"
            defaultValue={loaderData.post.content}
          />
          {/* 创建提交按钮，当表单提交状态为 "submitting" 时显示加载状态*/}
          <Button
            isLoading={navigation.state === "submitting"}
            type="submit"
            color="success"
          >
            更新
          </Button>
        </div>
      </Form>
      <div>
        <deleteFetcher.Form
          method="POST"
          action={`/posts/${loaderData.post.id}/delete`}
        >
          <Button
            name="action"
            value="delete"
            isLoading={isDeleting}
            color="danger"
            onClick={() => {
              if (confirm("Confirm to delete?")) {
                deleteFetcher.submit(null, {
                  method: "post",
                  action: `/posts/${loaderData.post.id}/delete`,
                });
              }
            }}
          >
            删除
          </Button>
        </deleteFetcher.Form>
      </div>
    </div>
  );
}
