import React, { useEffect } from 'react';
import { Form, Icon, Input, Button, Checkbox } from 'antd'
import "../style/login.scss";

function LoginForm(props) {
    console.log("login form props:", props)

    useEffect(()=>{
        console.log("enter login")
    })

    const { getFieldDecorator } = props.form;

    const handleSubmit = e => {
        e.preventDefault();
        props.form.validateFields((err, values) => {
            if (!err) {
                const handleLogin = props.handleLogin;
                handleLogin(values);
                console.log("Received values of form: ", values);
            }
        });
    }

    return (
        <div>
            <Form onSubmit={handleSubmit} className="login-form">
                <Form.Item>
                    {getFieldDecorator("roomId", {
                        rules: [{ required: true, message: "Please enter your room Id!" }]
                    })(
                        <Input
                            prefix={<Icon type="team" className="login-input-icon" />}
                            placeholder="Room Id"
                        />
                    )}
                </Form.Item>
                <Form.Item>
                    {getFieldDecorator("displayName", {
                        rules: [{ required: true, message: "Please enter your Name!" }]
                    })(
                        <Input
                            prefix={ <Icon type="contacts" className="login-input-icon" /> }
                            placeholder="Display Name"
                        />
                    )}
                </Form.Item>
                 <Form.Item>
                    {getFieldDecorator('audioOnly', {
                        valuePropName: 'checked',
                        initialValue: true,
                    })(
                        <Checkbox>
                            Audio only
                        </Checkbox>
                    )}
                </Form.Item>
                 <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-join-button">
                        Join
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}

const WrappedLoginForm = Form.create({ name: "login" })(LoginForm);
export default WrappedLoginForm;