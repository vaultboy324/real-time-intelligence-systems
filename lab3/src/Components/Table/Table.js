import React from 'react';

const config = require('../../../config/config');

class Table extends React.Component {
    state = {
        columns: ['Номер спутника', 'Год', 'Месяц', 'День', 'Час', 'Минута', 'Секунда', 'ΔX(Метры)', 'ΔY(Метры)', 'ΔZ(Метры)'],
        rows: []
    };

    async componentWillMount(){
        let response = await fetch(`${config.server}/`);
        let body = await response.json();
        this.setState({
            rows: body
        });
    }

    render() {
        return (
            <div>
                <table className="table table-bordered table-responsive-md text-center">
                    <thead>
                    <tr>
                        {
                            this.state.columns.map((item, index) => (
                                <th scope="col">{item}</th>
                            ))
                        }
                    </tr>
                    </thead>
                    {
                        this.state.rows.map((row, rowNum) => (
                            <tbody>
                            <tr>
                                {/*{*/}
                                {/*    row.map((item, index) => (*/}
                                {/*        <td>{item}</td>*/}
                                {/*    ))*/}
                                {/*}*/}
                                <td>{row.sputnik}</td>
                                <td>{row.year}</td>
                                <td>{row.month}</td>
                                <td>{row.day}</td>
                                <td>{row.hour}</td>
                                <td>{row.minute}</td>
                                <td>{row.second}</td>
                                <td>{row.xSVK}</td>
                                <td>{row.ySVK}</td>
                                <td>{row.zSVK}</td>
                            </tr>
                            </tbody>
                        ))
                    }
                </table>
            </div>
        )
    }
}

// import React from "react";
//
// function Table(oParams){
//     return (
//         <table className="table table-bordered table-responsive-md text-center">
//             <thead>
//             <tr>
//                 {
//                     oParams.columns.map((item, index)=> (
//                         <th scope="col">{item}</th>
//                     ))
//                 }
//             </tr>
//             </thead>
//             {
//                 oParams.rows.map((row, rowNum) => (
//                     <tbody>
//                     <tr>
//                         {
//                             row.map((item, index)=>(
//                                 <td><input id={oParams.type +'|' + rowNum.toString() + '|' + index.toString()} className="form-control" style={{backgroundColor:item}} onClick={oParams.onClick} contentEditable="false" readOnly="readOnly"/></td>
//                             ))
//                         }
//                     </tr>
//                     </tbody>
//                 ))
//             }
//         </table>
//     )
// }
//
// export default Table;

export default Table;