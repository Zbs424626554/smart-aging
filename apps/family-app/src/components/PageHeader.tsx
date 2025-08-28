import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack = true,
  onBack
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        {showBack && (
          <button className={styles.backButton} onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
    </div>
  );
};

export default PageHeader;
