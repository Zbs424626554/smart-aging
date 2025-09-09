import React from "react";
import { NavBar } from "antd-mobile";
import { useNavigate } from "react-router-dom";

interface PageNavBarProps {
    title?: string;
    showBack?: boolean;
    fallbackPath?: string;
    right?: React.ReactNode;
    onBack?: () => void;
}

const PageNavBar: React.FC<PageNavBarProps> = ({
    title,
    showBack = true,
    fallbackPath = "/home",
    right,
    onBack,
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallbackPath, { replace: true });
        }
    };

    return (
        <NavBar
            back={showBack ? "返回" : null}
            onBack={showBack ? handleBack : undefined}
            right={right}
        >
            {title}
        </NavBar>
    );
};

export default PageNavBar;








