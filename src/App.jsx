import { Layout, Card } from "antd";
import React from "react";
import LoginForm from './LoginForm';
import "../style/app.scss"

const { Header, Content, Footer, Sider } = Layout;
function App() {
    return (
        <Layout className="app-layout">
            <Header className="app-header">
            </Header>        
            <Content className="app-center-layout">
                <Card title="Join the Conference" className="app-login-card">
                    <LoginForm />
                </Card>
            </Content>
            <Footer>
            </Footer>
        </Layout>
    )
}

export default App;
