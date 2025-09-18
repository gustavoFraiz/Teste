import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EnqueteList = () => {
    const [enquetes, setEnquetes] = useState([]);
    const navigate = useNavigate();

    const fetchEnquetes = () => {
        axios.get('http://localhost:3001/api/enquetes')
            .then(response => {
                setEnquetes(response.data);
            })
            .catch(error => console.error("Erro ao buscar enquetes:", error));
    };

    useEffect(() => {
        fetchEnquetes();
    }, []);

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja deletar esta enquete?")) {
            axios.delete(`http://localhost:3001/api/enquetes/${id}`)
                .then(() => {
                    setEnquetes(enquetes.filter(e => e.id !== id));
                })
                .catch(error => {
                    console.error("Erro ao deletar enquete:", error);
                    alert("Não foi possível deletar a enquete.");
                });
        }
    };

    return (
        <div className="enquete-list-container">
            <div className="list-header">
                <h2>Todas as Enquetes</h2>
                <Link to="/criar-enquete" className="btn btn-primary">
                    Criar Nova Enquete
                </Link>
            </div>
            <ul className="enquete-list">
                {enquetes.map(enquete => (
                    <li key={enquete.id} className="enquete-item">
                        <div className="enquete-info" onClick={() => navigate(`/enquete/${enquete.id}`)}>
                            <h3>{enquete.titulo}</h3>
                            <span className={`status status-${enquete.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                {enquete.status}
                            </span>
                        </div>
                        <div className="enquete-actions">
                            <Link to={`/enquete/${enquete.id}/editar`} className="btn btn-secondary">
                                Editar
                            </Link>
                            <button onClick={() => handleDelete(enquete.id)} className="btn btn-danger">
                                Deletar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EnqueteList;

