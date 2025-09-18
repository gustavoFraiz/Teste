import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EnqueteForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [titulo, setTitulo] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [opcoes, setOpcoes] = useState(['', '', '']);

    const getFormattedDateTime = useCallback((date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }, []);

    useEffect(() => {
        if (isEditing) {
            axios.get(`http://localhost:3001/api/enquetes/${id}`)
                .then(response => {
                    const { titulo, data_inicio, data_fim, opcoes: opcoesDaApi } = response.data;
                    setTitulo(titulo);
                    setDataInicio(getFormattedDateTime(new Date(data_inicio)));
                    setDataFim(getFormattedDateTime(new Date(data_fim)));
                    if (opcoesDaApi && opcoesDaApi.length > 0) {
                        setOpcoes(opcoesDaApi.map(o => o.descricao));
                    }
                })
                .catch(error => console.error("Erro ao buscar dados da enquete:", error));
        }
    }, [id, isEditing, getFormattedDateTime]);

    const handleOpcaoChange = (index, value) => {
        const novasOpcoes = [...opcoes];
        novasOpcoes[index] = value;
        setOpcoes(novasOpcoes);
    };

    const adicionarOpcao = () => {
        setOpcoes([...opcoes, '']);
    };

    const removerOpcao = (index) => {
        if (opcoes.length > 3) {
            const novasOpcoes = opcoes.filter((_, i) => i !== index);
            setOpcoes(novasOpcoes);
        } else {
            alert("A enquete deve ter no mínimo 3 opções.");
        }
    };

    const handleSetNow = () => {
        setDataInicio(getFormattedDateTime(new Date()));
    };

    const handleSetEndInOneHour = () => {
        const oneHourLater = new Date();
        oneHourLater.setHours(oneHourLater.getHours() + 1);
        setDataFim(getFormattedDateTime(oneHourLater));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dadosEnquete = {
            titulo: titulo,
            data_inicio: dataInicio,
            data_fim: dataFim,
            opcoes: opcoes.filter(o => o.trim() !== '')
        };

        const request = isEditing
            ? axios.put(`http://localhost:3001/api/enquetes/${id}`, { titulo, data_inicio: dataInicio, data_fim: dataFim })
            : axios.post('http://localhost:3001/api/enquetes', dadosEnquete);

        request
            .then(() => {
                alert(`Enquete ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
                navigate('/');
            })
            .catch(error => {
                console.error("Erro ao salvar enquete:", error);
                alert("Ocorreu um erro. Verifique o console.");
            });
    };

    return (
        <div className="form-container">
            <h2>{isEditing ? 'Editar Enquete' : 'Criar Nova Enquete'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Título</label>
                    <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                </div>
                <div className="form-group">
                    <div className="label-helper-group">
                        <label>Data de Início</label>
                        {!isEditing && (
                            <button type="button" onClick={handleSetNow} className="btn-helper">Agora</button>
                        )}
                    </div>
                    <input type="datetime-local" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
                </div>
                <div className="form-group">
                    <div className="label-helper-group">
                        <label>Data de Fim</label>
                        {!isEditing && (
                            <button type="button" onClick={handleSetEndInOneHour} className="btn-helper">Terminar em 1 hora</button>
                        )}
                    </div>
                    <input type="datetime-local" value={dataFim} onChange={e => setDataFim(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label>Opções de Resposta</label>
                    {opcoes.map((opcao, index) => (
                        <div key={index} className="opcao-input">
                            <input
                                type="text"
                                value={opcao}
                                onChange={e => handleOpcaoChange(index, e.target.value)}
                                required
                                disabled={isEditing}
                            />
                            {!isEditing && opcoes.length > 3 && (
                                <button type="button" onClick={() => removerOpcao(index)} className="btn-remover-opcao">
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    {!isEditing && (
                        <button type="button" onClick={adicionarOpcao} className="btn-adicionar-opcao">
                            + Adicionar Opção
                        </button>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">{isEditing ? 'Salvar Alterações' : 'Criar Enquete'}</button>
                    <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default EnqueteForm;

