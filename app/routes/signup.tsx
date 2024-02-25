import { Button, Input } from "@nextui-org/react";
import { Form } from "@remix-run/react";

export default function Page() {
  return (
    <Form method="POST">
      <div className="p-12 flex flex-col gap-3">
        <Input label="用户名" name="username" />
        <Input type="password" label="密码" name="password" />
        <Button type="submit" color="primary">
          注册
        </Button>
      </div>
    </Form>
  )
}
