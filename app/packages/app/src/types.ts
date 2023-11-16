export interface Dashboard {
    title: string;
    url: string;
    folderTitle: string;
    folderUrl: string;
    tags: string[];
  }
  
  export interface Alert {
    name: string;
    state: string;
    url: string;
  }
  