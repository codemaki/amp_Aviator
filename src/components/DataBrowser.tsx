import { useEffect, useState } from 'react';
import { useWeaviateStore } from '../store/useWeaviateStore';
import { ArrowLeft, Loader2, Database, AlertCircle, FileJson, Trash2, Edit2, X, Save, Plus } from 'lucide-react';
import styles from './DataBrowser.module.css';

interface DataBrowserProps {
  className: string;
  onBack: () => void;
  properties: any[];
}

export default function DataBrowser({ className, onBack, properties }: DataBrowserProps) {
  const { url, apiKey, inferenceApiKey } = useWeaviateStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit & Create State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      const propNames = properties
        ?.filter(p => !p.dataType[0].includes('[]') && !p.dataType[0].includes('blob'))
        .map(p => p.name)
        .slice(0, 10) || []; 

      const propQuery = propNames.length > 0 ? propNames.join(' ') : '_additional { id }';
      
      const query = `{
        Get {
          ${className}(limit: 50) {
            ${propQuery}
            _additional {
              id
            }
          }
        }
      }`;

      const res = await fetch('/api/weaviate/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey, query })
      });
      
      const responseData = await res.json();
      
      if (responseData.errors) {
          throw new Error(responseData.errors[0].message);
      }
      
      const items = responseData.data?.Get?.[className] || [];
      setData(items);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url && className) {
      fetchObjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, apiKey, className, properties]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this object? This action cannot be undone.")) return;
    
    try {
      setIsDeleting(id);
      const res = await fetch('/api/weaviate/objects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey, id, className })
      });
      
      if (!res.ok) throw new Error('Failed to delete object');
      
      setData(prev => prev.filter(item => item._additional.id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting object");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setIsCreating(false);
    // Populate form data without _additional metadata
    const formData = { ...item };
    delete formData._additional;
    setEditFormData(formData);
  };

  const handleAddClick = () => {
    setIsCreating(true);
    setEditingItem(true); // Open modal condition
    
    // Create empty form based on properties schema
    const newForm: Record<string, any> = {};
    properties?.forEach(p => {
       if (p.dataType[0] === 'boolean') {
           newForm[p.name] = false;
       } else if (p.dataType[0] === 'int' || p.dataType[0] === 'number') {
           newForm[p.name] = 0;
       } else if (!p.dataType[0].includes('[]') && !p.dataType[0].includes('blob')) {
           newForm[p.name] = '';
       }
    });
    setEditFormData(newForm);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsCreating(false);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      const id = isCreating ? undefined : editingItem._additional.id;
      const method = isCreating ? 'POST' : 'PATCH';
      
      const res = await fetch('/api/weaviate/objects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          apiKey,
          inferenceApiKey,
          id,
          className,
          properties: editFormData
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || `Failed to ${isCreating ? 'create' : 'update'} object`);
      }
      
      if (isCreating) {
        // Refetch fully to ensure consistent formatting from GraphQL
        await fetchObjects();
      } else {
        // Update local state to reflect changes instantly without full refetch
        setData(prev => prev.map(item => 
          item._additional.id === id 
            ? { ...item, ...editFormData } 
            : item
        ));
      }
      
      closeModal();
    } catch (err: any) {
      alert(err.message || `Error ${isCreating ? 'creating' : 'updating'} object`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Collections
        </button>
        <div className={styles.titleRow}>
          <div className={styles.titleInfo}>
            <Database size={24} className={styles.icon} />
            <h2>{className} <span className={styles.badge}>{data.length} items</span></h2>
          </div>
          <button className={styles.addBtn} onClick={handleAddClick}>
            <Plus size={18} /> Add Object
          </button>
        </div>
      </div>

      <div className={`glass-panel ${styles.content}`}>
        {loading ? (
          <div className={styles.centeredState}>
            <Loader2 className={styles.spinner} size={48} />
            <p>Fetching objects...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
             <AlertCircle size={48} />
             <h3>Failed to load objects</h3>
             <p>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className={styles.emptyState}>
             <FileJson size={48} />
             <h3>No Objects Found</h3>
             <p>This collection currently has no data objects.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>_id</th>
                  {Object.keys(data[0] || {})
                    .filter(k => k !== '_additional')
                    .map(key => (
                      <th key={key}>{key}</th>
                  ))}
                  <th className={styles.actionCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={item._additional?.id || idx}>
                    <td className={styles.idCell}>{item._additional?.id}</td>
                    {Object.keys(item)
                      .filter(k => k !== '_additional')
                      .map(key => (
                        <td key={key}>
                          <div className={styles.cellContent}>
                            {typeof item[key] === 'object' 
                              ? JSON.stringify(item[key]) 
                              : String(item[key])}
                          </div>
                        </td>
                    ))}
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.editBtn} 
                          title="Edit"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className={styles.deleteBtn} 
                          title="Delete"
                          onClick={() => handleDelete(item._additional.id)}
                          disabled={isDeleting === item._additional.id}
                        >
                          {isDeleting === item._additional.id ? <Loader2 size={16} className={styles.spinnerIcon} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingItem && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modal}`}>
            <div className={styles.modalHeader}>
              <h3>{isCreating ? 'Create New Object' : 'Edit Object'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {!isCreating && (
                <div className={styles.inputGroup}>
                  <label>_id</label>
                  <input type="text" value={editingItem._additional.id} disabled className={styles.disabledInput} />
                </div>
              )}
              
              {Object.keys(editFormData).map(key => (
                <div key={key} className={styles.inputGroup}>
                  <label>{key}</label>
                  {typeof editFormData[key] === 'object' && editFormData[key] !== null ? (
                     <textarea 
                       value={JSON.stringify(editFormData[key], null, 2)}
                       onChange={(e) => {
                         try {
                           const parsed = JSON.parse(e.target.value);
                           setEditFormData(prev => ({ ...prev, [key]: parsed }));
                         } catch (err) {
                           // Ignore bad JSON until parsed successfully
                         }
                       }}
                       rows={4}
                     />
                  ) : (typeof editFormData[key] === 'boolean' || properties?.find(p => p.name === key)?.dataType[0] === 'boolean') ? (
                     <select 
                       value={String(editFormData[key])} 
                       onChange={(e) => setEditFormData(prev => ({ ...prev, [key]: e.target.value === 'true' }))}
                     >
                       <option value="true">true</option>
                       <option value="false">false</option>
                     </select>
                  ) : (properties?.find(p => p.name === key)?.dataType[0] === 'int' || properties?.find(p => p.name === key)?.dataType[0] === 'number') ? (
                     <input
                       type="number"
                       value={editFormData[key] || 0}
                       onChange={(e) => setEditFormData(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                     />
                  ) : (
                     <textarea 
                       value={editFormData[key] || ''}
                       onChange={(e) => setEditFormData(prev => ({ ...prev, [key]: e.target.value }))}
                       rows={3}
                     />
                  )}
                </div>
              ))}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelBtn} 
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className={styles.saveBtn} 
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={16} className={styles.spinnerIcon} /> : (isCreating ? <Plus size={16} /> : <Save size={16} />)} 
                {isSaving ? 'Saving...' : (isCreating ? 'Create' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
