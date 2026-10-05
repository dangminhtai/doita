const fs = require('node:fs');
const ts = require('typescript');
const paths = ['src/components/ui.tsx', ...['activities','auth','memories','notes','prayer','settings'].map(x=>`src/features/${x}/screen.tsx`)];
for (const path of paths) {
  const text = fs.readFileSync(path,'utf8');
  const source = ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const edits = [];
  function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source)==='select') {
      for(const tag of [node.openingElement.tagName,node.closingElement.tagName]) edits.push([tag.getStart(source),tag.end,'Select']);
      for(const prop of node.openingElement.attributes.properties) {
        if(ts.isJsxAttribute(prop)&&prop.name.text==='onChange') {
          edits.push([prop.name.getStart(source),prop.name.end,'onValueChange']);
          const expr=prop.initializer.expression;
          if(!ts.isArrowFunction(expr)) throw new Error(`Unexpected select handler in ${path}`);
          const parameter=expr.parameters[0].name.getText(source);
          function values(n) {
            if(ts.isPropertyAccessExpression(n)&&n.getText(source)===`${parameter}.target.value`) edits.push([n.getStart(source),n.end,parameter]);
            else ts.forEachChild(n,values);
          }
          values(expr.body);
        }
      }
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
  if(path!=='src/components/ui.tsx'&&edits.length) {
    const uiImport=source.statements.find(n=>ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='@/components/ui'&&n.importClause?.namedBindings);
    if(!uiImport)throw new Error(`Missing ui import in ${path}`);
    const bindings=uiImport.importClause.namedBindings;
    edits.push([bindings.getStart(source)+1,bindings.getStart(source)+1,'\n  Select,']);
  }
  let result=text;
  for(const [start,end,replacement]of edits.sort((a,b)=>b[0]-a[0]))result=result.slice(0,start)+replacement+result.slice(end);
  fs.writeFileSync(path,result,'utf8');
  console.log(`${path}: ${edits.length} targeted edits`);
}
